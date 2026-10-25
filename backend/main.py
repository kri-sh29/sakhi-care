"""SakhiCare backend API. Run from this folder: uvicorn main:app --reload"""
import os
from typing import Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from ai_service import create_summary, chat_reply

load_dotenv()
app = FastAPI(title="SakhiCare API", version="1.0.0")
origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["*"])

class Concern(BaseModel):
    concern: Literal["period", "pcos", "breast"]
    symptoms: list[str] = Field(max_length=15)
    duration: str = Field(max_length=60)
    frequency: str = Field(max_length=60)
    severity: int = Field(ge=1, le=10)
    notes: str = Field(default="", max_length=600)

URGENT = {"very heavy bleeding", "new lump", "nipple discharge", "fainting", "skin dimpling or redness"}

def needs_prompt_care(c: Concern) -> bool:
    return c.severity >= 9 or any(s.lower() in URGENT for s in c.symptoms)

@app.get("/health")
def health():
    return {"ok": True, "service": "SakhiCare backend"}

@app.post("/api/summary")
def summary(c: Concern):
    # Notes are deliberately not sent to the external AI provider.
    data, source = create_summary(c.model_dump(exclude={"notes"}))
    return {**data, "urgent": needs_prompt_care(c), "source": source,
            "disclaimer": "Health education only; not a diagnosis. Consult a healthcare professional."}


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    text: str = Field(min_length=1, max_length=1000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=8)

@app.post("/api/chat")
def chat(c: ChatRequest):
    message = c.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Please enter a question.")

    # Simple safety escalation for explicit urgent symptom phrases.
    urgent_phrases = (
        "fainting", "passed out", "can't breathe", "cannot breathe",
        "severe one-sided pain", "soaking a pad every hour", "very heavy bleeding",
        "heavy bleeding and dizzy", "chest pain", "suicidal", "want to hurt myself",
    )
    if any(phrase in message.lower() for phrase in urgent_phrases):
        return {
            "reply": (
                "I’m sorry you’re dealing with this. This may need urgent assessment. "
                "Please contact local emergency services or go to the nearest emergency department now, "
                "especially if symptoms are severe or worsening. If possible, ask someone you trust to stay with you. "
                "I can share general information, but I can’t assess an emergency in chat."
            ),
            "source": "safety",
            "disclaimer": "Health education only, not a diagnosis.",
        }

    try:
        reply = chat_reply(message, [item.model_dump() for item in c.history])
        return {
            "reply": reply,
            "source": "gemini",
            "disclaimer": "Health education only, not a diagnosis. Consult a healthcare professional for medical advice.",
        }
    except Exception as exc:
        print("Ask Sakhi request failed:", repr(exc))
        raise HTTPException(
            status_code=503,
            detail="Ask Sakhi is temporarily unavailable. Please try again or consult a healthcare professional.",
        )
