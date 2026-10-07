from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.document import Document
from app.models.analysis import DocumentAnalysis
from app.services.translation_service import translate_text


router = APIRouter(
    prefix="/voice",
    tags=["Voice Assistant"]
)


# =========================================================
# REQUEST / RESPONSE MODELS
# =========================================================

class VoiceQuestion(BaseModel):
    document_id: int | None = None
    question: str


class VoiceAnswer(BaseModel):
    answer: str
    document_id: int | None = None


class VoiceTranslationRequest(BaseModel):
    text: str
    target_language: str


class VoiceTranslationResponse(BaseModel):
    translated_text: str
    target_language: str


# =========================================================
# VOICE QUESTION
# =========================================================

@router.post("/ask", response_model=VoiceAnswer)
def ask_voice_question(
    request: VoiceQuestion,
    db: Session = Depends(get_db)
):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please provide a question."
        )

    # -----------------------------------------------------
    # NO DOCUMENT
    # -----------------------------------------------------

    if not request.document_id:

        return VoiceAnswer(
            answer=(
                "Please select and analyze a legal document first. "
                "Then I can answer questions based on your document."
            ),
            document_id=None
        )

    # -----------------------------------------------------
    # FIND DOCUMENT
    # -----------------------------------------------------

    document = (
        db.query(Document)
        .filter(Document.id == request.document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    # -----------------------------------------------------
    # FIND ANALYSIS
    # -----------------------------------------------------

    analysis = (
        db.query(DocumentAnalysis)
        .filter(
            DocumentAnalysis.document_id
            == request.document_id
        )
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail=(
                "This document has not been analyzed yet. "
                "Please analyze the document first."
            )
        )

    # -----------------------------------------------------
    # QUESTION PROCESSING
    # -----------------------------------------------------

    question_lower = question.lower()

    answer = None

    # Summary
    if any(
        word in question_lower
        for word in [
            "summary",
            "summarize",
            "about",
            "overview",
            "document"
        ]
    ):
        answer = analysis.summary

    # Risks
    elif any(
        word in question_lower
        for word in [
            "risk",
            "risks",
            "danger",
            "problem",
            "issue"
        ]
    ):
        answer = analysis.risks

    # Rights
    elif any(
        word in question_lower
        for word in [
            "right",
            "rights",
            "entitled"
        ]
    ):
        answer = analysis.rights

    # Obligations
    elif any(
        word in question_lower
        for word in [
            "obligation",
            "obligations",
            "responsibility",
            "responsibilities",
            "duty",
            "duties"
        ]
    ):
        answer = analysis.obligations

    # Key clauses
    elif any(
        word in question_lower
        for word in [
            "clause",
            "clauses",
            "key clause",
            "important clause"
        ]
    ):
        answer = analysis.key_clauses

    # Parties
    elif any(
        word in question_lower
        for word in [
            "party",
            "parties",
            "person",
            "people",
            "who"
        ]
    ):
        answer = analysis.parties

    # Dates
    elif any(
        word in question_lower
        for word in [
            "date",
            "dates",
            "deadline",
            "deadlines",
            "when"
        ]
    ):
        answer = analysis.important_dates

    # Laws
    elif any(
        word in question_lower
        for word in [
            "law",
            "laws",
            "legal",
            "act",
            "acts",
            "section"
        ]
    ):
        answer = analysis.relevant_laws

    # -----------------------------------------------------
    # FALLBACK
    # -----------------------------------------------------

    if not answer:

        answer = (
            "I can answer questions about the document's "
            "summary, key clauses, rights, obligations, "
            "risks, parties, important dates and relevant laws."
        )

    return VoiceAnswer(
        answer=str(answer),
        document_id=request.document_id
    )


# =========================================================
# TRANSLATE VOICE ANSWER
# =========================================================

@router.post(
    "/translate",
    response_model=VoiceTranslationResponse
)
def translate_voice_answer(
    request: VoiceTranslationRequest
):

    text = request.text.strip()
    target_language = request.target_language.strip().lower()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    if not target_language:
        raise HTTPException(
            status_code=400,
            detail="Please select a target language."
        )

    try:

        translated_text = translate_text(
            text,
            target_language
        )

        return VoiceTranslationResponse(
            translated_text=str(translated_text),
            target_language=target_language
        )

    except Exception as error:

        print(
            "Voice translation error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to translate the voice response."
        )