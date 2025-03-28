import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import PyPDF2
import spacy
from typing import Dict, Any
import tempfile
from datetime import datetime

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load NLP model (you might want to use a more specialized model)
nlp = spacy.load("en_core_web_sm")

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes"""
    logger.info("Extracting text from PDF")
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(file_bytes)
        temp_file_path = temp_file.name
    
    try:
        with open(temp_file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    finally:
        os.unlink(temp_file_path)

def parse_resume_text(text: str) -> Dict[str, Any]:
    """Parse resume text using NLP"""
    logger.info("Parsing resume text with NLP")
    
    doc = nlp(text)
    
    # Extract entities
    entities = {ent.label_: [] for ent in doc.ents}
    for ent in doc.ents:
        entities[ent.label_].append(ent.text)
    
    # Simple parsing logic - you'll want to enhance this
    name = entities.get("PERSON", ["Unknown"])[0]
    email = next((e for e in entities.get("EMAIL", []) if "@" in e), "unknown@email.com")
    phone = entities.get("PHONE", [""])[0]
    
    # Extract skills (simple version)
    skills = list(set([ent.text for ent in doc.ents if ent.label_ == "ORG" or ent.label_ == "PRODUCT"]))
    
    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": [],  # You'll want to implement proper education parsing
        "experience": [],  # You'll want to implement proper experience parsing
        "certifications": [],
        "languages": []
    }

@app.post("/parse-resume/")
async def parse_resume(file: UploadFile = File(...)):
    """Endpoint to parse a resume PDF"""
    try:
        logger.info(f"Received resume file: {file.filename}")
        
        # Read file content
        file_bytes = await file.read()
        
        # Extract text
        text = extract_text_from_pdf(file_bytes)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Parse text
        parsed_data = parse_resume_text(text)
        
        logger.info(f"Successfully parsed resume: {parsed_data}")
        return parsed_data
        
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"} 