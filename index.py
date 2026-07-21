import os
import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import google.generativeai as genai

app = FastAPI(title="LearnSathi AI Production Cloud Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExplainRequest(BaseModel):
    text: str = Field(..., min_length=2)
    language: str = Field(...)

class EvaluateRequest(BaseModel):
    question: str
    student_answer: str

def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Vercel Config Error: GEMINI_API_KEY environment variable is missing.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

@app.post("/api/explain")
async def process_text_transformation(payload: ExplainRequest):
    try:
        model = get_gemini_model()
        prompt = (
            f"You are LearnSathi AI, an expert school teacher. Explain the following textbook text "
            f"clearly and simply entirely in the {payload.language} language so a student in rural India can understand it. "
            f"Textbook text: {payload.text}"
        )
        res = model.generate_content(prompt)
        explanation = res.text if res.text else "Failed to generate summary context."
        
        quiz_prompt = f"Based on this lesson written in {payload.language}: '{explanation}', generate exactly one clear question checking understanding in {payload.language}."
        quiz_res = model.generate_content(quiz_prompt)
        quiz_question = quiz_res.text if quiz_res.text else "Review the content block."

        return {"explanation": explanation, "quiz_question": quiz_question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_textbook_page(language: str = Form(...), file: UploadFile = File(...)):
    try:
        model = get_gemini_model()
        image_bytes = await file.read()
        image_parts = [{"mime_type": file.content_type, "data": image_bytes}]
        
        vision_prompt = (
            f"Look closely at this textbook page image. Extract all readable English text from it, correcting typos. "
            f"Then explain the concepts simply in the {language} language using relatable rural Indian examples. "
            f"Format response exactly like this:\nEXTRACTED_TEXT: [text]\nEXPLANATION: [simple lesson]"
        )
        response = model.generate_content([vision_prompt, image_parts])
        response_text = response.text if response.text else ""
        
        extracted_text, explanation = "Processed page.", response_text
        if "EXTRACTED_TEXT:" in response_text and "EXPLANATION:" in response_text:
            parts = response_text.split("EXPLANATION:")
            extracted_text = parts[0].replace("EXTRACTED_TEXT:", "").strip()
            explanation = parts[1].strip()

        quiz_prompt = f"Based on this lesson written in {language}: '{explanation}', generate one short question in {language}."
        quiz_res = model.generate_content(quiz_prompt)
        
        return {"extracted_text": extracted_text, "explanation": explanation, "quiz_question": quiz_res.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate")
async def evaluate_response_performance(payload: EvaluateRequest):
    try:
        model = get_gemini_model()
        eval_prompt = (
            f"Question: {payload.question}\nStudent's Answer: {payload.student_answer}\n"
            f"Evaluate the answer strictly yet encouragingly. List correct points, missing concepts, mistakes, "
            f"and provide a final score card formatted as: 'Score: X/10'."
        )
        response = model.generate_content(eval_prompt)
        return {"evaluation": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))