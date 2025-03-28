from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Set
import uvicorn
import numpy as np
import pandas as pd
import json
import os
import re
import joblib
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="Resume Matching API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = "models"
STANDARD_MODEL_PATH = os.path.join(MODEL_DIR, "hiring_model.joblib")

try:
    if os.path.exists(STANDARD_MODEL_PATH):
        hiring_model = joblib.load(STANDARD_MODEL_PATH)
        print(f"Loaded model from {STANDARD_MODEL_PATH}")
    else:
        model_files = [f for f in os.listdir(MODEL_DIR) if f.startswith("hiring_model_") and f.endswith(".joblib")]
        if model_files:
            latest_model = sorted(model_files)[-1]
            model_path = os.path.join(MODEL_DIR, latest_model)
            hiring_model = joblib.load(model_path)
            print(f"Loaded most recent model from {model_path}")
        else:
            print("WARNING: No hiring prediction model found! The predict_hire endpoint will not work.")
            hiring_model = None
except Exception as e:
    print(f"Error loading model: {str(e)}")
    hiring_model = None

class HiringPredictionRequest(BaseModel):
    resume_text: str
    job_description: str  
    education: str
    industry: str
    work_type: str
    location: str
    applied_job_title: str
    experience_years: float
    salary_expectation: float
    offered_salary: float
    skills: List[str]
    required_skills: List[str]

class HiringPredictionResponse(BaseModel):
    hired_prediction: bool
    hiring_probability: float
    message: str

# Add new prediction endpoint
@app.post("/predict-hiring", response_model=HiringPredictionResponse)
async def predict_hiring(request: HiringPredictionRequest):
    """
    Predict if a candidate will be hired based on the trained XGBoost model.
    """
    if hiring_model is None:
        raise HTTPException(status_code=503, 
                           detail="Hiring prediction model is not available")
    
    # Preprocess the data for model input
    # Clean the text fields using your preprocess_text function
    resume_text_clean = preprocess_text(request.resume_text)
    job_description_clean = preprocess_text(request.job_description)
    
    # Calculate skill match ratio
    skill_match = get_skill_graph_score(request.skills, request.required_skills) / 100.0
    
    # Calculate salary difference
    salary_difference = request.offered_salary - request.salary_expectation
    
    # Prepare input dataframe with the same structure as training data
    input_data = {
        'Resume_Text_Clean': resume_text_clean,
        'Job_Description_Clean': job_description_clean,
        'Education': request.education,
        'Industry': request.industry, 
        'Work_Type': request.work_type,
        'Location': request.location,
        'Applied_Job_Title': request.applied_job_title,
        'Experience (Years)': request.experience_years,
        'Salary_Expectation': request.salary_expectation,
        'Offered_Salary': request.offered_salary,
        'Salary_Difference': salary_difference,
        'Skill_Match_Ratio': skill_match,
    }
    
    # Convert to DataFrame for model input
    input_df = pd.DataFrame([input_data])
    
    try:
        # Make prediction
        prediction = hiring_model.predict(input_df)[0]
        probability = hiring_model.predict_proba(input_df)[0][1]
        
        return {
            "hired_prediction": bool(prediction),
            "hiring_probability": float(probability),
            "message": "Candidate is likely to be hired" if prediction else "Candidate is not likely to be hired"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# Helper function to preprocess text for the model - similar to your hiring_model.py
def preprocess_text(text):
    """Clean and preprocess text data using regex"""
    if isinstance(text, str):
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove common stopwords manually
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = text.split()
        words = [word for word in words if word not in stopwords]
        
        return ' '.join(words)
    else:
        return ""

class JobDescription(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    
class Candidate(BaseModel):
    name: str
    resume_text: str
    extracted_skills: List[str]

class MatchedCandidate(BaseModel):
    name: str
    match: int 
    
class MatchResponse(BaseModel):
    candidates: List[MatchedCandidate]

SKILL_GRAPH = {
    "python": {"django", "flask", "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "data science", "machine learning"},
    "javascript": {"typescript", "nodejs", "reactjs", "angularjs", "vuejs", "frontend"},
    "java": {"spring", "hibernate", "maven", "j2ee", "backend"},

    "machine learning": {"deep learning", "neural networks", "ai", "tensorflow", "pytorch", "scikit-learn", "data science"},
    "deep learning": {"neural networks", "tensorflow", "pytorch", "computer vision", "nlp"},
    "data science": {"statistics", "machine learning", "python", "r", "sql", "data analysis", "data visualization"},

    "devops": {"aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "jenkins", "terraform"},
    "cloud": {"aws", "azure", "gcp", "docker", "kubernetes", "serverless"},
    
    # Databases
    "sql": {"mysql", "postgresql", "oracle", "sql server", "database"},
    "nosql": {"mongodb", "cassandra", "redis", "dynamodb", "database"},
    
    # Soft skills
    "communication": {"teamwork", "presentation", "leadership", "interpersonal"},
    "leadership": {"management", "team lead", "project management", "communication"},
}

#
# Matching Functions
#
# Load the sentence transformer model once (global)
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def expand_skills(skills: List[str]) -> Set[str]:
    """
    Expand a list of skills to include related skills from the skill graph.
    """
    skills_lower = [skill.lower() for skill in skills]
    expanded_skills = set(skills_lower)
    
    for skill in skills_lower:
        if skill in SKILL_GRAPH:
            expanded_skills.update(SKILL_GRAPH[skill])
    
    return expanded_skills

def get_skill_graph_score(candidate_skills: List[str], job_skills: List[str]) -> float:
    """
    Calculate skill graph score by expanding skills and finding matches.
    """
    # Expand candidate skills
    expanded_candidate_skills = expand_skills(candidate_skills)
    
    # Prepare job skills
    job_skills_set = set(skill.lower() for skill in job_skills)
    expanded_job_skills = expand_skills(job_skills)
    
    # Calculate direct matches (exact skill matches)
    direct_matches = sum(1 for skill in job_skills_set if skill in expanded_candidate_skills)
    
    # Calculate expanded matches (related skills)
    expanded_matches = sum(1 for skill in expanded_job_skills if skill in expanded_candidate_skills)
    
    # Weigh direct matches higher than expanded matches
    if not job_skills:
        return 100.0  # Avoid division by zero
    
    # Calculate score with direct matches worth 70% and expanded worth 30%
    total_score = (0.7 * (direct_matches / len(job_skills_set))) + \
                  (0.3 * (expanded_matches / len(expanded_job_skills)))
    
    return total_score * 100  # Convert to percentage

def get_skills_match_score(candidate_skills: List[str], required_skills: List[str], 
                           preferred_skills: List[str]) -> float:
    """
    Calculate skills match score between candidate skills and job skills.
    Required skills are weighted higher than preferred skills.
    """
    # Convert lists to sets for faster lookups
    candidate_skills_set = set(skill.lower() for skill in candidate_skills)
    required_skills_set = set(skill.lower() for skill in required_skills)
    preferred_skills_set = set(skill.lower() for skill in preferred_skills) if preferred_skills else set()
    
    # Count matches
    required_matches = sum(1 for skill in required_skills_set if skill in candidate_skills_set)
    preferred_matches = sum(1 for skill in preferred_skills_set if skill in candidate_skills_set)
    
    # Calculate scores
    # Required skills are worth 80% of the skills score, preferred skills 20%
    if not required_skills:
        required_score = 1.0  # Avoid division by zero
    else:
        required_score = required_matches / len(required_skills_set)
        
    if not preferred_skills_set:
        preferred_score = 1.0  # If no preferred skills, give full points
    else:
        preferred_score = preferred_matches / len(preferred_skills_set)
    
    # Weight the scores
    total_score = (0.8 * required_score) + (0.2 * preferred_score)
    return total_score * 100  # Convert to percentage

def get_tfidf_similarity(resume_text: str, job_description: str) -> float:
    """
    Calculate TF-IDF similarity between resume text and job description.
    """
    # Create TF-IDF vectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    
    # Fit and transform documents
    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
    
    # Calculate cosine similarity
    cos_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
    
    return float(cos_similarity[0][0]) * 100  # Convert to percentage

def get_semantic_similarity(resume_text: str, job_description: str) -> float:
    """
    Calculate semantic similarity using sentence transformers.
    """
    # Encode documents
    resume_embedding = model.encode(resume_text, convert_to_tensor=True)
    job_embedding = model.encode(job_description, convert_to_tensor=True)
    
    # Calculate cosine similarity
    cos_similarity = cosine_similarity(
        resume_embedding.cpu().numpy().reshape(1, -1), 
        job_embedding.cpu().numpy().reshape(1, -1)
    )
    
    return float(cos_similarity[0][0]) * 100  # Convert to percentage

def match_candidates_to_job(job: JobDescription, candidates: List[Candidate]) -> List[MatchedCandidate]:
    """
    Match candidates to a job and return a ranked list.
    """
    results = []
    
    for candidate in candidates:
        # Step 2: Skills match score
        skills_score = get_skills_match_score(
            candidate.extracted_skills, 
            job.required_skills, 
            job.preferred_skills
        )
        
        # Step 3: Semantic similarity score
        semantic_score = get_semantic_similarity(candidate.resume_text, job.description)
        
        # Step 4: TF-IDF similarity score
        tfidf_score = get_tfidf_similarity(candidate.resume_text, job.description)
        
        # Step 5: Skill Graph score
        skill_graph_score = get_skill_graph_score(candidate.extracted_skills, job.required_skills + job.preferred_skills)
        
        # Step 6: Calculate final weighted score
        # 60% semantic, 20% TF-IDF, 10% direct skill match, 10% skill graph
        final_score = (0.6 * semantic_score) + (0.2 * tfidf_score) + \
                       (0.1 * skills_score) + (0.1 * skill_graph_score)
        
        # Round the score to nearest integer
        match_percentage = round(final_score)
        
        # Cap at 100
        match_percentage = min(match_percentage, 100)
        
        results.append(MatchedCandidate(name=candidate.name, match=match_percentage))
    
    # Sort results by match score (descending)
    results.sort(key=lambda x: x.match, reverse=True)
    
    return results

def prepare_candidate_data(json_file_path):
    """
    Prepare candidate data from the JSON file for resume matching
    """
    with open(json_file_path, 'r') as file:
        data = json.load(file)
    
    candidates = []
    job_description = None

    for item in data:
        # Extract job description from the first job posting
        if not job_description and 'job_description' in item:
            job_description = JobDescription(
                title=item['job_description'].get('applied_job_title', 'Not Specified'),
                description=" ".join(item['job_description'].get('job_responsibilities', [])),
                required_skills=(
                    item['job_description']['required_skills'].get('core_technologies', []) + 
                    item['job_description']['required_skills'].get('state_management', []) + 
                    item['job_description']['required_skills'].get('styling', [])
                ),
                preferred_skills=(
                    item['job_description']['required_skills'].get('soft_skills', [])
                )
            )
        
        # Extract candidate information
        if 'personal_information' in item:
            # Combine skills from different categories
            all_skills = (
                item.get('skills', {}).get('mobile_development', []) +
                item.get('skills', {}).get('backend', []) +
                item.get('skills', {}).get('tools', [])
            )
            
            candidate = Candidate(
                name=item['personal_information'].get('name', 'Unknown'),
                resume_text=f"Mobile Application Developer with experience in {', '.join(all_skills)}. " + 
                            f"Worked at {', '.join([exp['company'] for exp in item.get('work_experience', [])])}. " +
                            f"Education: {item['education'][0]['degree'] if item.get('education') else 'Not Specified'}",
                extracted_skills=all_skills
            )
            candidates.append(candidate)

    return job_description, candidates

@app.get("/process-and-match-resumes")
async def process_and_match_resumes():
    """
    Process resumes from the resumes_data.json file and match them to a job description
    """
    try:
        # Use fixed path to your JSON file
        json_file_path = os.path.join(os.path.dirname(__file__), "resumes_data.json")
        
        # Prepare job description and candidates
        job_description, candidates = prepare_candidate_data(json_file_path)
        
        if not job_description or not candidates:
            raise HTTPException(status_code=400, detail="Could not extract job description or candidates")
        
        # Match candidates to job
        ranked_candidates = match_candidates_to_job(job_description, candidates)
        
        print(f"Ranked candidates: {ranked_candidates}")
        return {"candidates": ranked_candidates}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resumes: {str(e)}")
#
# API Endpoints
#
@app.get("/")
async def root():
    return {"message": "Resume Matching API is running"}

# @app.post("/match-resumes", response_model=MatchResponse)
# async def match_resumes(job: JobDescription, candidates: List[Candidate]):
#     if not job.description or not job.required_skills:
#         raise HTTPException(status_code=400, detail="Job description and required skills are required")
    
#     if len(candidates) == 0:
#         raise HTTPException(status_code=400, detail="At least one candidate must be provided")
        
#     # Match candidates to job
#     ranked_candidates = match_candidates_to_job(job, candidates)
    
#     return {"candidates": ranked_candidates}

# Run the application
if __name__ == "__main__":
    uvicorn.run("resume_matcher:app", host="0.0.0.0", port=8080, reload=True)