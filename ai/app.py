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
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime
import google.generativeai as genai
from functools import lru_cache
from pathlib import Path


# Load environment variables
load_dotenv()

# Initialize Gemini
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-pro-latest')
    print("✅ Gemini configured successfully")
except Exception as e:
    print(f"❌ Gemini configuration failed: {e}")
    raise

# Initialize FastAPI
app = FastAPI(
    title="AI Resume Parser with Gemini Enhancement",
    version="1.0",
    debug=True
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RawResumeData(BaseModel):
    raw_text: str
    processed_data: Dict[str, Any]

async def extract_raw_text_from_pdf(file: UploadFile) -> str:
    """Extract raw text from PDF without any processing"""
    try:
        if file.content_type != "application/pdf":
            raise ValueError("Only PDF files are accepted")
            
        contents = await file.read()
        if not contents:
            raise ValueError("Empty file uploaded")
            
        if len(contents) > 5 * 1024 * 1024:
            raise ValueError("File too large (max 5MB)")
            
        pdf_file = io.BytesIO(contents)
        reader = PyPDF2.PdfReader(pdf_file)
        if len(reader.pages) == 0:
            raise ValueError("PDF contains no pages")
            
        text = "\n".join([page.extract_text() or "" for page in reader.pages])
        if not text.strip():
            raise ValueError("No text could be extracted from PDF")
            
        file.file.seek(0)
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF processing failed: {str(e)}")

async def process_with_gemini(raw_text: str) -> Dict[str, Any]:
    """Send raw text to Gemini for complete processing"""
    prompt = f"""
    Analyze this raw resume text and extract all relevant information.
    Return a comprehensive JSON structure containing:
    - Personal information (name, email, phone)
    - Education history (degrees, institutions, years)
    - Work experience (companies, positions, durations)
    - Skills (technical and soft skills)
    - Certifications
    - Any other relevant information
    
    Structure the output in a professional, standardized format.
    Correct any typos or inconsistencies you find.
    
    RAW RESUME TEXT:
    {raw_text[:10000]}  # First 10,000 characters to avoid token limits
    
    Return ONLY the JSON output. Do not include any additional text or explanations.
    The JSON should be properly formatted with all fields correctly named.
    """
    
    try:
        response = model.generate_content(prompt)
        
        json_str = response.text[response.text.find('{'):response.text.rfind('}')+1]
        return json.loads(json_str)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini processing failed: {str(e)}"
        )

RESUMES_JSON_FILE = "resumes_data.json"

def initialize_resumes_file():
    """Create the JSON file if it doesn't exist with an empty list"""
    if not Path(RESUMES_JSON_FILE).exists():
        with open(RESUMES_JSON_FILE, 'w') as f:
            json.dump([], f)

def append_resume_to_file(new_resume: Dict[str, Any]) -> bool:
    """
    Append a new resume to the JSON file if it doesn't already exist.
    Returns True if resume was added, False if it already existed.
    """
    try:
        # Read existing data
        with open(RESUMES_JSON_FILE, 'r') as f:
            existing_data: List[Dict[str, Any]] = json.load(f)
        
        if "email" in new_resume and new_resume["email"]:
            for existing_resume in existing_data:
                if "email" in existing_resume and existing_resume["email"] == new_resume["email"]:
                    print(f"Resume with email {new_resume['email']} already exists. Skipping.")
                    return False
        
        # As a fallback, also check by name if email is missing
        elif "name" in new_resume and new_resume["name"]:
            for existing_resume in existing_data:
                if "name" in existing_resume and existing_resume["name"] == new_resume["name"]:
                    print(f"Resume with name {new_resume['name']} already exists. Skipping.")
                    return False
        
        # Append new resume only if it doesn't exist
        existing_data.append(new_resume)
        
        # Write back to file
        with open(RESUMES_JSON_FILE, 'w') as f:
            json.dump(existing_data, f, indent=2)
        
        print(f"Added new resume to file: {new_resume.get('email', new_resume.get('name', 'Unknown'))}")
        return True
            
    except Exception as e:
        print(f"Failed to update resumes file: {str(e)}")
        raise Exception(f"Failed to update resumes file: {str(e)}")

# Initialize the file when module loads
initialize_resumes_file()

# Then modify your existing send_data endpoint like this:
@app.post("/send-data", response_model=RawResumeData)
async def send_data(file: UploadFile = File(...)):
    """Endpoint that sends raw resume data to Gemini for processing"""
    try:
        # 1. Extract raw text from PDF
        raw_text = await extract_raw_text_from_pdf(file)
        
        # 2. Send directly to Gemini for processing
        processed_data = await process_with_gemini(raw_text)
        
        # 3. Append to JSON file if not already exists
        was_added = append_resume_to_file(processed_data)
        
        response_data = RawResumeData(
            raw_text=raw_text[:1000] + "... [truncated]",
            processed_data=processed_data
        )
        
        # Add a note about whether the resume was added or already existed
        if not was_added:
            response_data.processed_data["note"] = "Resume already exists in database"
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(e)}"
        )
# Load spaCy model
try:
    nlp = spacy.load("en_core_web_lg")
    print("✅ spaCy model loaded successfully")
except Exception as e:
    print(f"❌ spaCy model loading failed: {e}")
    raise

# Initialize Supabase
try:
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    print("✅ Supabase connection successful")
except Exception as e:
    print(f"❌ Supabase connection failed: {e}")
    raise

# Constants
SKILL_BLACKLIST = {
    "and", "the", "with", "using", "via", "from", "to", 
    "in", "on", "at", "for", "my", "our", "we", "i",
    "|", "", " ", "  ", "-", "•", ":", ";", ",", "."
}

TECHNICAL_SKILLS = [
    "Python", "Java", "JavaScript", "C++", "SQL", "NoSQL", 
    "HTML", "CSS", "React", "Angular", "Node.js", "Django",
    "Flask", "TensorFlow", "PyTorch", "Machine Learning",
    "Data Science", "Data Analysis", "Android Development",
    "IoT", "Cloud Computing", "AWS", "Azure", "Git",
    "REST API", "GraphQL", "Docker", "Kubernetes",
    "Computer Engineering", "Research", "Web Development"
]

# Models
class EnhancedResumeData(BaseModel):
    resume_text: str
    job_description: str
    education: str
    industry: str
    applied_job_title: str
    experience_years: float
    salary_expectation: float
    skills: List[str]
    corrections_made: List[str] = Field(default_factory=list)

class ResumeData(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    resume_text: str
    extracted_skills: List[str]
    work_experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    certifications: Optional[List[str]] = None
    enhanced_data: Optional[EnhancedResumeData] = None

class JobApplication(BaseModel):
    job_id: str
    candidate_id: str

class JobWithCandidates(BaseModel):
    job: Dict[str, Any]
    candidates: List[ResumeData]

# Helper Functions
def initialize_nlp_components():
    skill_patterns = list(nlp.pipe([
        skill for skill in TECHNICAL_SKILLS 
        if len(skill.split()) < 3
    ]))
    skill_matcher = PhraseMatcher(nlp.vocab)
    skill_matcher.add("SKILL", skill_patterns)

    experience_matcher = Matcher(nlp.vocab)
    experience_patterns = [
        [{"POS": "PROPN", "OP": "+"}, {"LOWER": "at"}, {"POS": "PROPN", "OP": "+"}],
        [{"POS": "PROPN", "OP": "+"}, {"LOWER": ","}, {"LOWER": "inc"}],
        [{"POS": "PROPN", "OP": "+"}, {"LOWER": "company"}],
    ]
    experience_matcher.add("EXPERIENCE", experience_patterns)

    return skill_matcher, experience_matcher

skill_matcher, experience_matcher = initialize_nlp_components()

def is_valid_skill(text):
    return (
        len(text) > 2 and
        not any(char.isdigit() for char in text) and
        text.lower() not in SKILL_BLACKLIST and
        not text.isspace() and
        not text.endswith((".", ",", ";", ":"))
    )

def extract_skills(doc) -> List[str]:
    skills = set()
    matches = skill_matcher(doc)
    for match_id, start, end in matches:
        skill = doc[start:end].text
        if is_valid_skill(skill):
            skills.add(skill)
    
    for sent in doc.sents:
        if any(kw in sent.text.lower() for kw in ["skill", "experience", "proficient"]):
            for token in sent:
                if (token.pos_ in ["NOUN", "PROPN"] and is_valid_skill(token.text)):
                    skills.add(token.text)
    
    return sorted({re.sub(r'[^\w\s]', '', s).strip() for s in skills if is_valid_skill(s)})

def extract_from_section(doc, section_title):
    section_content = []
    found_section = False
    for sent in doc.sents:
        if section_title.lower() in sent.text.lower():
            found_section = True
            continue
        if found_section and any(kw in sent.text.lower() for kw in ["experience", "education"]):
            break
        if found_section:
            section_content.append(sent.text)
    return " ".join(section_content)

async def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        if file.content_type != "application/pdf":
            raise ValueError("Only PDF files are accepted")
            
        contents = await file.read()
        if not contents:
            raise ValueError("Empty file uploaded")
            
        if len(contents) > 5 * 1024 * 1024:
            raise ValueError("File too large (max 5MB)")
            
        pdf_file = io.BytesIO(contents)
        reader = PyPDF2.PdfReader(pdf_file)
        if len(reader.pages) == 0:
            raise ValueError("PDF contains no pages")
            
        text = "\n".join([page.extract_text() or "" for page in reader.pages])
        if not text.strip():
            raise ValueError("No text could be extracted from PDF")
            
        file.file.seek(0)
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF processing failed: {str(e)}")

async def upload_resume_to_storage(file: UploadFile) -> str:
    try:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        await file.seek(0)
        file_contents = await file.read()
        
        supabase.storage.from_("resumes").upload(
            path=unique_filename,
            file=file_contents,
            file_options={"content-type": file.content_type, "x-upsert": "true"}
        )
        return supabase.storage.from_("resumes").get_public_url(unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload resume: {str(e)}")

def extract_contact_info(doc) -> Dict[str, str]:
    contact_info = {"name": "", "email": "", "phone": ""}
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            contact_info["name"] = ent.text
            break
    
    emails = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", doc.text)
    if emails:
        contact_info["email"] = emails[0]
    
    phones = re.findall(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", doc.text)
    if phones:
        contact_info["phone"] = phones[0]
    
    return contact_info

def extract_experience(doc) -> List[Dict[str, Any]]:
    experiences = []
    current_position = None
    current_dates = None
    
    for sent in doc.sents:
        if (" at " in sent.text or " for " in sent.text or 
            " intern " in sent.text.lower() or "internship" in sent.text.lower()):
            position = sent.text.split(" at ")[0] if " at " in sent.text else sent.text
            current_position = position.split(" for ")[0] if " for " in position else position
        
        date_matches = re.findall(
            r"((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]\s\d{4}|\d{4}).?((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|\d{4}|Present|Current)", 
            sent.text, 
            re.IGNORECASE
        )
        if date_matches:
            current_dates = f"{date_matches[0][0]} - {date_matches[0][2]}"
        
        if current_position and current_dates:
            experiences.append({
                "position": current_position.strip(),
                "duration": current_dates,
                "description": sent.text,
                "type": "internship" if "intern" in current_position.lower() else "work"
            })
            current_position = current_dates = None
    
    return experiences

def extract_education(doc) -> List[Dict[str, Any]]:
    education = []
    current_degree = None
    current_school = None
    
    for sent in doc.sents:
        if any(kw in sent.text for kw in ["Bachelor", "Master", "PhD", "Doctorate"]):
            current_degree = sent.text.split(" in ")[0] if " in " in sent.text else sent.text
        
        if any(kw in sent.text for kw in ["University", "College", "Institute"]):
            current_school = sent.text
        
        if current_degree and current_school:
            education.append({
                "degree": current_degree,
                "institution": current_school
            })
            current_degree = current_school = None
    
    return education

@lru_cache(maxsize=100)
async def enhance_resume_with_gemini(raw_text: str, extracted_data: dict) -> EnhancedResumeData:
    prompt = f"""
    Analyze this resume and enhance the extracted data:
    
    RAW TEXT EXCERPT:
    {raw_text[:3000]}
    
    CURRENT EXTRACTION:
    {json.dumps(extracted_data, indent=2)}
    
    Please return enhanced data in this exact format:
    {{
        "resume_text": "Enhanced professional summary",
        "job_description": "Matched job description",
        "education": "Standardized education",
        "industry": "Detected industry",
        "applied_job_title": "Suggested job title",
        "experience_years": X.X,
        "salary_expectation": XXXXX.X,
        "skills": ["Standardized", "Skills"],
        "corrections_made": ["List of corrections"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        json_str = response.text[response.text.find('{'):response.text.rfind('}')+1]
        return EnhancedResumeData(**json.loads(json_str))
    except Exception as e:
        print(f"Gemini enhancement failed: {str(e)}")
        return EnhancedResumeData(
            resume_text=extracted_data.get("resume_text", ""),
            job_description="",
            education=", ".join([edu.get("degree", "") for edu in extracted_data.get("education", [])]),
            industry="",
            applied_job_title="",
            experience_years=len(extracted_data.get("work_experience", [])),
            salary_expectation=0,
            skills=extracted_data.get("extracted_skills", []),
            corrections_made=["Gemini enhancement failed"]
        )

# API Endpoints
@app.post("/parse-resume/", response_model=ResumeData)
async def parse_resume(file: UploadFile = File(...)):
    try:
        text = await extract_text_from_pdf(file)
        doc = nlp(text)
        
        contact_info = extract_contact_info(doc)
        skills = extract_skills(doc)
        experience = extract_experience(doc) or []
        education = extract_education(doc) or []
        
        extracted_data = {
            "resume_text": text[:5000],
            "education": education,
            "work_experience": experience,
            "extracted_skills": skills,
            "contact_info": contact_info
        }
        
        enhanced_data = await enhance_resume_with_gemini(text, extracted_data)
        resume_url = await upload_resume_to_storage(file)
        
        resume_record = {
            "id": str(uuid.uuid4()),
            "name": contact_info["name"],
            "email": contact_info["email"],
            "phone": contact_info["phone"],
            "resume_url": resume_url,
            "resume_text": text,
            "extracted_skills": enhanced_data.skills,
            "work_experience": experience,
            "education": education,
            "enhanced_data": enhanced_data.dict(),
            "created_at": datetime.now().isoformat()
        }
        
        supabase.table("candidates").insert(resume_record).execute()
        
        return ResumeData(
            name=contact_info["name"],
            email=contact_info["email"],
            phone=contact_info["phone"],
            resume_text=text,
            extracted_skills=enhanced_data.skills,
            work_experience=experience,
            education=education,
            enhanced_data=enhanced_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.post("/apply-job/")
async def apply_to_job(application: JobApplication):
    try:
        candidate = supabase.table("candidates").select("*").eq("id", application.candidate_id).execute()
        job = supabase.table("jobs").select("*").eq("id", application.job_id).execute()
        
        if not candidate.data or not job.data:
            raise HTTPException(status_code=404, detail="Candidate or Job not found")
        
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

@app.post("/analyze-candidate")
async def analyze_candidate(request: dict):
    """
    Analyze a candidate's resume using Gemini to identify strengths and weaknesses.
    """
    try:
        candidate_data = request.get("candidate_data")
        if not candidate_data:
            return {"error": "No candidate data provided"}
        
        # Prepare prompt for Gemini
        prompt = f"""
        Analyze the following candidate information and provide:
        1. Three key strengths of the candidate
        2. Three areas for improvement
        3. Overall suitability for tech roles
        
        Make the analysis concise and specific to their skills and experience.
        
        Candidate Data:
        {candidate_data}
        
        Format your response as JSON with these keys:
        - strengths: [array of strengths]
        - improvements: [array of areas for improvement]
        - suitability: A brief assessment of their fit for tech roles
        """
        
        # Generate response from Gemini
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        # Parse the response (assumes Gemini returns properly formatted JSON)
        try:
            analysis = response.text
            # Clean up the response if it contains markdown code blocks
            if "```json" in analysis:
                analysis = analysis.split("```json")[1].split("```")[0].strip()
            
            # Return the analysis
            return {"analysis": analysis}
        except Exception as e:
            return {"error": f"Failed to parse Gemini response: {str(e)}"}
            
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}

@app.get("/job-applications/{job_id}", response_model=JobWithCandidates)
async def get_job_applications(job_id: str):
    try:
        job = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        applications = supabase.table("applications").select("*").eq("job_id", job_id).execute()
        candidates = []
        
        for app in applications.data:
            candidate = supabase.table("candidates").select("*").eq("id", app["candidate_id"]).execute()
            if candidate.data:
                candidates.append(candidate.data[0])
        
        return JobWithCandidates(job=job.data[0], candidates=candidates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)