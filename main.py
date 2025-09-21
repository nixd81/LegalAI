# main.py
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import PyPDF2
from docx import Document
from fastapi.responses import FileResponse
import pytesseract
from PIL import Image
import os
import requests
import re
import fitz  # pip install PyMuPDF
import json
from typing import List, Dict, Optional
from semantic_matcher import SemanticMatcher, create_semantic_matcher, get_highlighting_info

app = FastAPI()



# Enable CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Initialize semantic matcher (singleton for performance)
_semantic_matcher = None

def get_semantic_matcher() -> SemanticMatcher:
    """Get or create semantic matcher instance"""
    global _semantic_matcher
    if _semantic_matcher is None:
        _semantic_matcher = create_semantic_matcher()
    return _semantic_matcher

def get_gemini_response(text, user_query=""):
    if not GEMINI_API_KEY:
        return "NO GEMINI API KEY SET"
    if user_query.strip():
        prompt = (
            "You are an authoritative legal assistant. Given the following legal document and the user's specific concern, "
            "provide a confident, plain-English, step-by-step answer to the query. Lead the user—they may depend entirely on you.\n"
            f"User Query: {user_query}\nDocument:\n{text}"
        )
    else:
        prompt = (
            "Analyze this legal document. Summarize in plain English, prioritize actionable steps for the user, "
            "and never present options—always provide direct, prioritized instructions. For each step, include a concise rationale."
            " If risk is detected, be explicit. Use a confident, empathetic, and firm tone. "
            "Create a traffic-light risk summary (safe, caution, danger) and a checklist of actions to take."
            f"\nDocument:\n{text}"
        )
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    resp = requests.post(url, headers=headers, json=data, timeout=60)
    if resp.ok:
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    return f"Gemini API error: {resp.text}"
def get_risk(text):
    red_flags = ["penalty", "termination", "indemnity", "liability"]
    yellow_flags = ["notice", "fee", "fine", "late", "interest"]
    t = text.lower()
    for flag in red_flags:
        if flag in t:
            return "red"
    for flag in yellow_flags:
        if flag in t:
            return "yellow"
    return "green"


def extract_text_pdf(file_path):
    text = ""
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text

def extract_text_docx(file_path):
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_image(file_path):
    img = Image.open(file_path)
    return pytesseract.image_to_string(img)

def split_clauses(text):
    prompt = (
        "Extract a JSON list of all major legal clauses or sections from the following document. "
        "Each clause should include its heading/title (if any) and its full text. "
        "Return the result as JSON in the form: "
        "[{\"title\": \"Clause Title\", \"text\": \"Full clause content.\"}, ...]\n"
        "Document:\n" + text
    )
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    resp = requests.post(url, headers=headers, json=data, timeout=60)
    if resp.ok:
        import json
        try:
            raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            # Try to extract only the JSON from the model’s output
            start = raw.find('[')
            end = raw.rfind(']') + 1
            return json.loads(raw[start:end])
        except Exception as e:
            return [{"title": "Entire Document", "text": text}]
    return [{"title": "Error extracting clauses", "text": text}]

def find_clause_by_number_or_title(clauses, query):
    import re
    # Try to match a clause number
    m = re.search(r'clause[\s#]*(\d+)', query.lower())
    if m:
        idx = int(m.group(1)) - 1
        if 0 <= idx < len(clauses):
            return clauses[idx]['title'], clauses[idx]['text']
    # Fallback: try to match by keyword in title
    for clause in clauses:
        if clause['title'] and clause['title'].lower() in query.lower():
            return clause['title'], clause['text']
    return None, None


@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    query: str = Form("")
):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    ext = file.filename.split(".")[-1].lower()
    if ext == "pdf":
        text = extract_text_pdf(tmp_path)
    elif ext in ("docx", "doc"):
        text = extract_text_docx(tmp_path)
    elif ext in ("jpg", "jpeg", "png"):
        text = extract_text_image(tmp_path)
    else:
        os.remove(tmp_path)
        return {"error": "Unsupported file type"}
    clauses = split_clauses(text) 
    os.remove(tmp_path)
    ai_summary = get_gemini_response(text, query)
    risk = get_risk(text)
    return {
        
        "extracted_text": text,
        "ai_summary": ai_summary,
        "risk": risk,
        "user_query": query,
        "clauses": clauses
    }
import json

@app.post("/chat/")
async def chatbot(
    document: str = Form(...),
    question: str = Form(...),
    clauses: str = Form("")
):
    clause_list = []
    try:
        clause_list = json.loads(clauses) if clauses else []
    except Exception:
        clause_list = []

    title, clause_text = find_clause_by_number_or_title(clause_list, question)
    if clause_text:
        prompt = (
            f"The user asked about '{title}'. Here is the relevant clause from their document:\n{clause_text}\n\n"
            f"Explain this clause in simple language and answer any questions about it. "
            "Reference only this clause directly."
            f"\nUser Question: {question}"
        )
    else:
        prompt = (
            "You are a helpful and authoritative legal AI. Using the following document, answer the user's question concisely and clearly. "
            "Reference the document context as needed, and if the answer is uncertain, say so clearly. "
            f"\nDocument:\n{document}\nUser Question: {question}"
        )
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    resp = requests.post(url, headers=headers, json=data, timeout=60)
    if resp.ok:
        return {"answer": resp.json()["candidates"][0]["content"]["parts"][0]["text"]}
    return {"error": resp.text}

@app.post("/explain/")
async def explain_clause(
    clause: str = Form(...),
    user_query: str = Form("")
):
    # Use a focused prompt
    prompt = (
    "Explain the following legal clause for a layperson in MARKDOWN format only. "
    "Start with a one-sentence summary in bold. "
    "Then give 3–5 very short bullet points with responsibilities, risks, or obligations. "
    "End with a bold 'Bottom Line:' summary. "
    "Use only Markdown formatting (bullets, bold, headings—no paragraphs, no legal jargon). "
    f"{'User query: ' + user_query if user_query else ''}\nClause:\n{clause}"
)

    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    resp = requests.post(url, headers=headers, json=data, timeout=60)
    if resp.ok:
        return {"explanation": resp.json()["candidates"][0]["content"]["parts"][0]["text"]}
    else:
        return {"error": resp.text}
    
def extract_clause_keywords(user_query: str):
    prompt = (
        "You are a legal assistant. The user will ask about clauses in a contract. "
        "Extract ALL relevant clause keywords (like liability, termination, rent, security deposit, jurisdiction). "
        "Return them as a JSON array of lowercase strings. \n"
        "Examples:\n"
        "User query: \"What about rent and deposit?\" → [\"rent\", \"security deposit\"]\n"
        "User query: \"Show me the termination clause\" → [\"termination\"]\n"
        "User query: \"Where is the dispute resolution clause?\" → [\"dispute resolution\"]\n"
        f"User query: {user_query}"
    )

    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    resp = requests.post(url, headers=headers, json=data, timeout=60)

    if resp.ok:
        import json
        try:
            raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            start = raw.find("[")
            end = raw.rfind("]") + 1
            return json.loads(raw[start:end])  # Returns a Python list
        except Exception:
            return []
    return []



def highlight_clause_in_pdf(input_pdf, keywords, clauses, output_pdf="highlighted.pdf"):
    """Legacy function for keyword-based highlighting"""
    doc = fitz.open(input_pdf)
    keywords = [k.lower() for k in keywords]

    for clause in clauses:
        for keyword in keywords:
            if keyword in clause['title'].lower() or keyword in clause['text'].lower():
                clause_text = clause['text'].strip()

                # Try full clause highlight
                found = False
                for page in doc:
                    matches = page.search_for(clause_text)
                    if matches:
                        for inst in matches:
                            page.add_highlight_annot(inst).update()
                        found = True

                # If full text not found → fallback to chunks
                if not found:
                    chunks = clause_text.split(". ")
                    for chunk in chunks:
                        if len(chunk) > 5:  # skip tiny fragments
                            for page in doc:
                                matches = page.search_for(chunk)
                                for inst in matches:
                                    page.add_highlight_annot(inst).update()

    doc.save(output_pdf)
    return output_pdf

def highlight_semantic_matches_in_pdf(input_pdf, query, clauses, output_pdf="highlighted.pdf"):
    """Enhanced PDF highlighting using semantic matching"""
    doc = fitz.open(input_pdf)
    matcher = get_semantic_matcher()
    
    # Get highlighting segments using semantic matching
    highlighting_info = get_highlighting_info(query, clauses, matcher)
    segments = highlighting_info['segments']
    
    # Track highlighted areas to avoid duplicates
    highlighted_areas = set()
    
    for segment in segments:
        text_to_highlight = segment['text']
        confidence = segment['confidence']
        
        # Choose highlight color based on confidence
        if confidence == 'high':
            color = (1, 1, 0)  # Yellow for high confidence
        elif confidence == 'medium':
            color = (1, 0.8, 0)  # Orange for medium confidence
        else:
            color = (1, 0.6, 0)  # Light orange for low confidence
        
        # Try to find and highlight the text
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Search for the text on this page
            matches = page.search_for(text_to_highlight)
            
            for match in matches:
                # Create a unique identifier for this match
                match_id = f"{page_num}_{match.x0}_{match.y0}_{match.x1}_{match.y1}"
                
                if match_id not in highlighted_areas:
                    # Add highlight annotation
                    highlight = page.add_highlight_annot(match)
                    highlight.set_colors(stroke=color)
                    highlight.update()
                    highlighted_areas.add(match_id)
            
            # If exact match not found, try fuzzy matching with sentence chunks
            if not matches and len(text_to_highlight) > 20:
                # Split into smaller chunks for better matching
                sentences = re.split(r'[.!?]+', text_to_highlight)
                for sentence in sentences:
                    if len(sentence.strip()) > 10:
                        fuzzy_matches = page.search_for(sentence.strip())
                        for match in fuzzy_matches:
                            match_id = f"{page_num}_{match.x0}_{match.y0}_{match.x1}_{match.y1}"
                            if match_id not in highlighted_areas:
                                highlight = page.add_highlight_annot(match)
                                highlight.set_colors(stroke=color)
                                highlight.update()
                                highlighted_areas.add(match_id)
    
    doc.save(output_pdf)
    return output_pdf, highlighting_info


@app.post("/highlight_pdf/")
async def highlight_pdf(file: UploadFile = File(...), query: str = Form(...)):
    """Enhanced PDF highlighting with semantic matching"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.write(await file.read())
    temp_file.close()

    try:
        text = extract_text_pdf(temp_file.name)
        clauses = split_clauses(text)

        # Use semantic matching for better results
        output_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
        highlighted_pdf, highlighting_info = highlight_semantic_matches_in_pdf(
            temp_file.name, query, clauses, output_pdf
        )

        # Return both the PDF and highlighting metadata
        return FileResponse(
            highlighted_pdf, 
            media_type="application/pdf", 
            filename="highlighted_clause.pdf",
            headers={
                "X-Highlighting-Info": json.dumps(highlighting_info)
            }
        )
    
    except Exception as e:
        # Fallback to legacy keyword-based highlighting
        try:
            keywords = extract_clause_keywords(query)
            if not keywords:
                return {"error": "Could not determine clause keywords from query."}
            
            output_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
            highlight_clause_in_pdf(temp_file.name, keywords, clauses, output_pdf)
            
            return FileResponse(output_pdf, media_type="application/pdf", filename="highlighted_clause.pdf")
        
        except Exception as fallback_error:
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(fallback_error)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)

@app.post("/semantic_search/")
async def semantic_search(
    query: str = Form(...),
    clauses: str = Form(...)
):
    """Perform semantic search on clauses without PDF processing"""
    try:
        clauses_data = json.loads(clauses) if isinstance(clauses, str) else clauses
        matcher = get_semantic_matcher()
        
        # Get semantic matches
        highlighting_info = get_highlighting_info(query, clauses_data, matcher)
        
        return {
            "query": query,
            "matches": highlighting_info['matches'],
            "segments": highlighting_info['segments'],
            "query_analysis": highlighting_info['query_analysis']
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in semantic search: {str(e)}")

@app.post("/analyze_query/")
async def analyze_query(query: str = Form(...)):
    """Analyze a user query to extract keywords, synonyms, and intent"""
    try:
        matcher = get_semantic_matcher()
        analysis = matcher.analyze_query(query)
        
        return {
            "original_query": analysis.original_query,
            "keywords": analysis.keywords,
            "synonyms": analysis.synonyms,
            "expanded_terms": analysis.expanded_terms,
            "intent": analysis.intent,
            "legal_entities": analysis.legal_entities
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing query: {str(e)}")

@app.get("/health/")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "semantic_matcher": "available"}

