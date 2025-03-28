import re
import uuid
import io
import json
import traceback
import PyPDF2
import spacy
from spacy.matcher import Matcher, PhraseMatcher
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize FastAPI with debug mode
app = FastAPI(
    title="AI Resume Parser",
    version="1.0",
    debug=True
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model with verification
try:
    nlp = spacy.load("en_core_web_lg")
    print("✅ spaCy model loaded successfully")
except Exception as e:
    print(f"❌ spaCy model loading failed: {e}")
    raise

# Initialize Supabase with verification
try:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing Supabase credentials in .env file")
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Test connection
    test_response = supabase.table("candidates").select("*").limit(1).execute()
    print("✅ Supabase connection successful")
except Exception as e:
    print(f"❌ Supabase connection failed: {e}")
    raise

# Skill blacklist
SKILL_BLACKLIST = {
    "and", "the", "with", "using", "via", "from", "to", 
    "in", "on", "at", "for", "my", "our", "we", "i",
    "|", "", " ", "  ", "-", "•", ":", ";", ",", "."
}

# Enhanced NLP patterns and matchers
def initialize_nlp_components():
    # More focused technical skills list
    technical_skills = [
        "Python", "Java", "JavaScript", "C++", "SQL", "NoSQL", 
        "HTML", "CSS", "React", "Angular", "Node.js", "Django",
        "Flask", "TensorFlow", "PyTorch", "Machine Learning",
        "Data Science", "Data Analysis", "Android Development",
        "IoT", "Cloud Computing", "AWS", "Azure", "Git",
        "REST API", "GraphQL", "Docker", "Kubernetes",
        "Computer Engineering", "Research", "Web Development"
    ]
    
    # Only include multi-word phrases if they're actual technical terms
    skill_patterns = list(nlp.pipe([
        skill for skill in technical_skills 
        if len(skill.split()) < 3  # Exclude long phrases
    ]))
    
    skill_matcher = PhraseMatcher(nlp.vocab)
    skill_matcher.add("SKILL", skill_patterns)

    # Experience matcher
    experience_matcher = Matcher(nlp.vocab)
    experience_patterns = [
        [{"POS": "PROPN", "OP": "+"}, {"LOWER": "at"}, {"POS": "PROPN", "OP": "+"}],
        [{"POS": "PROPN", "OP": "+"}, {"LOWER": ","}, {"LOWER": "inc"}],
        [{"POS": "PROPN", "OP": "+"}, {"LOWER": "company"}],
    ]
    experience_matcher.add("EXPERIENCE", experience_patterns)

    return skill_matcher, experience_matcher

skill_matcher, experience_matcher = initialize_nlp_components()

# Pydantic models for request/response
class ResumeData(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    resume_text: str
    extracted_skills: List[str]
    work_experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    certifications: Optional[List[str]] = None

class JobApplication(BaseModel):
    job_id: str
    candidate_id: str

class JobWithCandidates(BaseModel):
    job: Dict[str, Any]
    candidates: List[ResumeData]

def is_valid_skill(text):
    """Check if text looks like a real skill"""
    return (
        len(text) > 2 and
        not any(char.isdigit() for char in text) and
        text.lower() not in SKILL_BLACKLIST and
        not text.isspace() and
        not text.endswith((".", ",", ";", ":"))
    )

def extract_skills(doc) -> List[str]:
    """Extract skills using NLP and pattern matching with improved filtering"""
    skills = set()
    
    # 1. Match using the phrase matcher (technical skills)
    matches = skill_matcher(doc)
    for match_id, start, end in matches:
        skill = doc[start:end].text
        if is_valid_skill(skill):
            skills.add(skill)
    
    # 2. Extract from context with better filtering
    for sent in doc.sents:
        # Only look in relevant sections
        if any(keyword in sent.text.lower() 
              for keyword in ["skill", "experience", "proficient", "knowledge", "technology"]):
            
            for token in sent:
                # Filter conditions
                if (token.pos_ in ["NOUN", "PROPN"] and 
                    is_valid_skill(token.text)):
                    skills.add(token.text)
    
    # 3. Post-processing cleanup
    filtered_skills = set()
    for skill in skills:
        # Remove punctuation and clean up
        clean_skill = re.sub(r'[^\w\s]', '', skill).strip()
        if is_valid_skill(clean_skill):
            filtered_skills.add(clean_skill)
    
    return sorted(filtered_skills)

def extract_from_section(doc, section_title):
    """Extract content from specific resume sections"""
    section_content = []
    found_section = False
    
    for sent in doc.sents:
        if section_title.lower() in sent.text.lower():
            found_section = True
            continue
        if found_section:
            # Stop at next section
            if any(keyword in sent.text.lower() 
                  for keyword in ["experience", "education", "projects", "certifications"]):
                break
            section_content.append(sent.text)
    
    return " ".join(section_content)

# Core parsing functions
async def extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from PDF resume with validation"""
    try:
        # Verify file type
        if file.content_type != "application/pdf":
            raise ValueError("Only PDF files are accepted")
            
        contents = await file.read()
        if not contents:
            raise ValueError("Empty file uploaded")
            
        # Verify file size (e.g., 5MB max)
        if len(contents) > 5 * 1024 * 1024:
            raise ValueError("File too large (max 5MB)")
            
        pdf_file = io.BytesIO(contents)
        try:
            reader = PyPDF2.PdfReader(pdf_file)
        except PyPDF2.errors.PdfReadError:
            raise ValueError("Invalid PDF file")
            
        if len(reader.pages) == 0:
            raise ValueError("PDF contains no pages")
            
        text = "\n".join([page.extract_text() or "" for page in reader.pages])
        if not text.strip():
            raise ValueError("No text could be extracted from PDF")
            
        # Reset file pointer for later use
        file.file.seek(0)
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF processing failed: {str(e)}")

async def upload_resume_to_storage(file: UploadFile) -> str:
    """Upload resume to Supabase Storage with proper authentication"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Read file contents
        await file.seek(0)
        file_contents = await file.read()
        
        # Upload with proper content type
        supabase.storage.from_("resumes").upload(
            path=unique_filename,
            file=file_contents,
            file_options={
                "content-type": file.content_type,
                "x-upsert": "true"  # Overwrite if exists
            }
        )
        
        # Get public URL
        return supabase.storage.from_("resumes").get_public_url(unique_filename)
        
    except Exception as e:
        print(f"🔥 Storage upload failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload resume: {str(e)}"
        )

def extract_contact_info(doc) -> Dict[str, str]:
    """Extract name, email, and phone from resume"""
    contact_info = {"name": "", "email": "", "phone": ""}
    
    # Extract name (first PERSON entity)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            contact_info["name"] = ent.text
            break
    
    # Extract email
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    emails = re.findall(email_pattern, doc.text)
    if emails:
        contact_info["email"] = emails[0]
    
    # Extract phone numbers
    phone_pattern = r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
    phones = re.findall(phone_pattern, doc.text)
    if phones:
        contact_info["phone"] = phones[0]
    
    return contact_info

def extract_experience(doc) -> List[Dict[str, Any]]:
    """Extract structured work experience including internships"""
    experiences = []
    current_company = None
    current_position = None
    current_dates = None
    
    for sent in doc.sents:
        # Look for company names (including internship indicators)
        company_patterns = [
            [{"POS": "PROPN", "OP": "+"}, {"LOWER": "at"}, {"POS": "PROPN", "OP": "+"}],
            [{"POS": "PROPN", "OP": "+"}, {"LOWER": ","}, {"LOWER": "inc"}],
            [{"POS": "PROPN", "OP": "+"}, {"LOWER": "company"}],
            [{"LOWER": "intern", "OP": "+"}, {"POS": "PROPN", "OP": "+"}],
            [{"LOWER": "internship", "OP": "+"}, {"POS": "PROPN", "OP": "+"}]
        ]
        
        # Look for position titles (including internship roles)
        if (" at " in sent.text or 
            " for " in sent.text or 
            " intern " in sent.text.lower() or
            "internship" in sent.text.lower()):
            
            # Clean up position title
            position = sent.text.split(" at ")[0] if " at " in sent.text else sent.text
            position = position.split(" for ")[0] if " for " in position else position
            current_position = position.strip()
        
        # Look for date ranges (more flexible pattern)
        date_pattern = r"((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|\d{4}).*?((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|\d{4}|Present|Current)"
        date_matches = re.findall(date_pattern, sent.text, re.IGNORECASE)
        if date_matches:
            current_dates = f"{date_matches[0][0]} - {date_matches[0][2]}"
        
        # When we have complete experience info
        if current_position and current_dates:
            experiences.append({
                "company": current_company or "Various",  # Default if company not found
                "position": current_position,
                "duration": current_dates,
                "description": sent.text,
                "type": "internship" if "intern" in current_position.lower() else "work"
            })
            current_company = current_position = current_dates = None
    
    return experiences

def extract_skills(doc) -> List[str]:
    """Extract only valid technical skills"""
    # Define valid technical skills (can be expanded)
    TECHNICAL_SKILLS = {
        "Python", "Java", "JavaScript", "C++", "HTML", "CSS",
        "React", "Angular", "Node.js", "Django", "Flask",
        "Machine Learning", "Data Science", "Data Analysis",
        "Android Development", "Web Development", "SQL",
        "MongoDB", "Git", "REST API", "Docker", "AWS"
    }
    
    # Define skill context keywords
    SKILL_CONTEXT_KEYWORDS = {
        "skills", "proficient", "expertise", "experienced",
        "knowledge", "familiar", "technologies", "stack"
    }
    
    skills = set()
    current_section = None
    
    for sent in doc.sents:
        # Detect section headers
        if any(word in sent.text.lower() for word in ["experience", "education", "projects"]):
            current_section = sent.text.lower()
        
        # Only extract from skills section or near skill-related keywords
        if (current_section and "skill" in current_section) or \
           any(keyword in sent.text.lower() for keyword in SKILL_CONTEXT_KEYWORDS):
            
            # Check for exact matches of technical skills
            for skill in TECHNICAL_SKILLS:
                if skill.lower() in sent.text.lower():
                    skills.add(skill)
            
            # Check for skill patterns
            for token in sent:
                if (token.pos_ in ["NOUN", "PROPN"] and 
                    len(token.text) > 3 and 
                    not token.is_stop and
                    token.text[0].isupper() and
                    token.text.lower() not in {"and", "with", "using"}):
                    
                    # Additional filtering
                    clean_skill = re.sub(r'[^a-zA-Z0-9+#]', '', token.text)
                    if clean_skill and len(clean_skill) > 2:
                        skills.add(clean_skill)
    
    # Post-processing cleanup
    filtered_skills = set()
    for skill in skills:
        # Remove version numbers (e.g., Python 3)
        base_skill = re.sub(r'\s*\d+\.?\d*', '', skill).strip()
        if base_skill and base_skill in TECHNICAL_SKILLS:
            filtered_skills.add(base_skill)
    
    return sorted(filtered_skills)

def extract_education(doc) -> List[Dict[str, Any]]:
    """Extract education information"""
    education = []
    current_degree = None
    current_school = None
    current_year = None
    
    for sent in doc.sents:
        # Look for degree types
        degree_keywords = ["Bachelor", "Master", "PhD", "Doctorate", "Diploma", "Certificate"]
        if any(keyword in sent.text for keyword in degree_keywords):
            current_degree = sent.text.split(" in ")[0] if " in " in sent.text else sent.text
        
        # Look for school names
        school_keywords = ["University", "College", "Institute", "School"]
        if any(keyword in sent.text for keyword in school_keywords):
            current_school = sent.text
        
        # Look for graduation year
        year_match = re.search(r"\b(19|20)\d{2}\b", sent.text)
        if year_match:
            current_year = year_match.group()
        
        # When we have complete education info
        if current_degree and current_school:
            education.append({
                "degree": current_degree,
                "institution": current_school,
                "year": current_year
            })
            current_degree = current_school = current_year = None
    
    return education

# API Endpoints
@app.post("/parse-resume/", response_model=ResumeData)
async def parse_resume(file: UploadFile = File(...)):
    """Endpoint to parse resume and extract structured data"""
    try:
        print(f"🔍 Processing file: {file.filename}")
        
        # Extract text from PDF
        text = await extract_text_from_pdf(file)
        print(f"📝 Extracted text length: {len(text)} characters")
        
        doc = nlp(text)
        
        # Extract from skills section specifically if exists
        skills_section = extract_from_section(doc, "skills")
        skills_doc = nlp(skills_section) if skills_section else doc
        
        # Extract all information
        contact_info = extract_contact_info(doc)
        print(f"👤 Contact info: {contact_info}")
        
        skills = extract_skills(skills_doc)
        print(f"🛠️ Skills found: {skills}")
        
        experience = extract_experience(doc) or []
        print(f"💼 Experience entries: {len(experience)}")
        
        education = extract_education(doc) or []
        print(f"🎓 Education entries: {len(education)}")

        # Upload to storage
        resume_url = await upload_resume_to_storage(file)
        print(f"📤 Resume stored at: {resume_url}")
        
        # Prepare database record
        resume_data = {
            "id": str(uuid.uuid4()),
            "name": contact_info["name"],
            "email": contact_info["email"],
            "phone": contact_info["phone"],
            "resume_url": resume_url,
            "resume_text": text,
            "extracted_skills": skills,
            "work_experience": experience,
            "education": education,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Save to database
        supabase.table("candidates").insert(resume_data).execute()
        print("💾 Saved to Supabase successfully")
        
        return ResumeData(
            name=contact_info["name"],
            email=contact_info["email"],
            phone=contact_info["phone"],
            resume_text=text,
            extracted_skills=skills,
            work_experience=experience,
            education=education
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 Error trace:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(e)}"
        )

@app.post("/apply-job/")
async def apply_to_job(application: JobApplication):
    """Endpoint for candidates to apply to jobs"""
    try:
        # Check if candidate and job exist
        candidate = supabase.table("candidates").select("*").eq("id", application.candidate_id).execute()
        job = supabase.table("jobs").select("*").eq("id", application.job_id).execute()
        
        if not candidate.data or not job.data:
            raise HTTPException(status_code=404, detail="Candidate or Job not found")
        
        # Create application record
        application_data = {
            "candidate_id": application.candidate_id,
            "job_id": application.job_id,
            "applied_at": datetime.now().isoformat(),
            "status": "Submitted"
        }
        
        response = supabase.table("applications").insert(application_data).execute()
        return {"message": "Application submitted successfully", "application_id": response.data[0]["id"]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/job-applications/{job_id}", response_model=JobWithCandidates)
async def get_job_applications(job_id: str):
    """Get all applications for a specific job with parsed resume data"""
    try:
        # Get job details
        job = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get all applications for this job
        applications = supabase.table("applications").select("*").eq("job_id", job_id).execute()
        
        # Get candidate details for each application
        candidates = []
        for app in applications.data:
            candidate = supabase.table("candidates").select("*").eq("id", app["candidate_id"]).execute()
            if candidate.data:
                candidates.append(candidate.data[0])
        
        return JobWithCandidates(
            job=job.data[0],
            candidates=candidates
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Resume Parser API server...")
    print(f"🔗 Supabase URL: {SUPABASE_URL}")
    print(f"🔑 Supabase Key: {'*' * len(SUPABASE_KEY) if SUPABASE_KEY else 'MISSING'}")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )