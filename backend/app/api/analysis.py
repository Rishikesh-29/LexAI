from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.analysis import DocumentAnalysis
from app.models.document import Document
from app.models.user import User
from app.services.ai_service import (
    analyze_document,
    answer_document_question,
)
from app.services.multilingual_service import (
    prepare_text_for_analysis,
)


router = APIRouter(
    prefix="/documents",
    tags=["AI Legal Analysis"],
)


# =========================================================
# DOCUMENT QUESTION REQUEST
# =========================================================

class DocumentQuestionRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="Question to ask about the uploaded document",
    )


@router.post(
    "/{document_id}/analyze",
    status_code=status.HTTP_200_OK,
)
def analyze_legal_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze a legal document and save the result
    permanently in document_analyses.

    Multilingual processing:
    - English documents are analyzed directly.
    - Supported Indian-language documents are
      automatically translated to English before AI analysis.
    - Original extracted text is never modified.
    """

    # =====================================================
    # FIND DOCUMENT
    # =====================================================

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # =====================================================
    # CHECK EXTRACTED TEXT
    # =====================================================

    if not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extracted text available for this document.",
        )

    # =====================================================
    # MULTILINGUAL TEXT PREPARATION
    # =====================================================

    try:

        multilingual_result = (
            prepare_text_for_analysis(
                document.extracted_text
            )
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(
            "MULTILINGUAL PROCESSING ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to prepare document "
                "for AI analysis."
            ),
        ) from exc

    # =====================================================
    # GET ANALYSIS TEXT
    # =====================================================

    analysis_text = multilingual_result[
        "analysis_text"
    ]

    detected_language = multilingual_result[
        "detected_language"
    ]

    detected_language_name = multilingual_result[
        "detected_language_name"
    ]

    was_translated = (
        multilingual_result[
            "was_translated"
        ]
    )

    print(
        "DOCUMENT LANGUAGE:",
        detected_language_name,
    )

    print(
        "LANGUAGE CODE:",
        detected_language,
    )

    print(
        "TRANSLATED FOR ANALYSIS:",
        was_translated,
    )

    # =====================================================
    # RUN AI ANALYSIS
    # =====================================================

    try:

        analysis = analyze_document(
            analysis_text
        )

    except Exception as exc:

        print(
            "AI ANALYSIS ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis error: {str(exc)}",
        ) from exc

    # =====================================================
    # GET RIGHTS AND OBLIGATIONS
    # =====================================================

    rights = analysis.get(
        "rights",
        [],
    )

    obligations = analysis.get(
        "obligations",
        [],
    )

    # =====================================================
    # CHECK EXISTING ANALYSIS
    # =====================================================

    document_analysis = (
        db.query(DocumentAnalysis)
        .filter(
            DocumentAnalysis.document_id
            == document.id
        )
        .first()
    )

    # =====================================================
    # UPDATE EXISTING ANALYSIS
    # =====================================================

    if document_analysis:

        document_analysis.summary = (
            analysis.get("summary")
        )

        document_analysis.key_clauses = (
            analysis.get(
                "key_clauses",
                [],
            )
        )

        document_analysis.rights = rights

        document_analysis.obligations = (
            obligations
        )

        document_analysis.risks = (
            analysis.get(
                "risks",
                [],
            )
        )

        document_analysis.relevant_laws = (
            analysis.get(
                "relevant_laws",
                [],
            )
        )

        document_analysis.important_dates = (
            analysis.get(
                "important_dates",
                [],
            )
        )

        document_analysis.parties = (
            analysis.get(
                "parties",
                [],
            )
        )

    # =====================================================
    # CREATE NEW ANALYSIS
    # =====================================================

    else:

        document_analysis = DocumentAnalysis(
            document_id=document.id,

            summary=analysis.get(
                "summary"
            ),

            key_clauses=analysis.get(
                "key_clauses",
                [],
            ),

            rights=rights,

            obligations=obligations,

            risks=analysis.get(
                "risks",
                [],
            ),

            relevant_laws=analysis.get(
                "relevant_laws",
                [],
            ),

            important_dates=analysis.get(
                "important_dates",
                [],
            ),

            parties=analysis.get(
                "parties",
                [],
            ),
        )

        db.add(
            document_analysis
        )

    # =====================================================
    # UPDATE DOCUMENT STATUS
    # =====================================================

    document.status = "analyzed"

    # =====================================================
    # SAVE ANALYSIS
    # =====================================================

    try:

        db.commit()

        db.refresh(
            document_analysis
        )

    except Exception as exc:

        db.rollback()

        print(
            "DATABASE SAVE ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to save document "
                f"analysis: {str(exc)}"
            ),
        ) from exc

    # =====================================================
    # RETURN COMPLETE ANALYSIS
    # =====================================================

    return {
        "document_id": document.id,

        "analysis_id": document_analysis.id,

        "filename": document.filename,

        "status": document.status,

        # -------------------------------------------------
        # MULTILINGUAL INFORMATION
        # -------------------------------------------------

        "detected_language": detected_language,

        "detected_language_name": (
            detected_language_name
        ),

        "translated_for_analysis": (
            was_translated == "true"
        ),

        # -------------------------------------------------
        # ANALYSIS
        # -------------------------------------------------

        "summary": document_analysis.summary,

        "key_clauses": (
            document_analysis.key_clauses
        ),

        "rights": (
            document_analysis.rights
        ),

        "obligations": (
            document_analysis.obligations
        ),

        "risks": (
            document_analysis.risks
        ),

        "relevant_laws": (
            document_analysis.relevant_laws
        ),

        "important_dates": (
            document_analysis.important_dates
        ),

        "parties": (
            document_analysis.parties
        ),

        # -------------------------------------------------
        # DISCLAIMER
        # -------------------------------------------------

        "disclaimer": (
            "This analysis is generated by an "
            "automated system for informational "
            "purposes and should not be treated "
            "as legal advice."
        ),
    }


# =========================================================
# GET SAVED DOCUMENT ANALYSIS
# =========================================================

@router.get(
    "/{document_id}/analysis",
    status_code=status.HTTP_200_OK,
)
def get_document_analysis(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve the saved AI analysis of a document.

    The document must belong to the authenticated user.
    """

    # =====================================================
    # FIND DOCUMENT
    # =====================================================

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # =====================================================
    # FIND SAVED ANALYSIS
    # =====================================================

    document_analysis = (
        db.query(DocumentAnalysis)
        .filter(
            DocumentAnalysis.document_id
            == document.id
        )
        .first()
    )

    if not document_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Analysis not found for this document."
            ),
        )

    # =====================================================
    # RETURN SAVED ANALYSIS
    # =====================================================

    return {
        "document_id": document.id,

        "analysis_id": document_analysis.id,

        "filename": document.filename,

        "status": document.status,

        "summary": document_analysis.summary,

        "key_clauses": (
            document_analysis.key_clauses
        ),

        "rights": (
            document_analysis.rights
        ),

        "obligations": (
            document_analysis.obligations
        ),

        "risks": (
            document_analysis.risks
        ),

        "relevant_laws": (
            document_analysis.relevant_laws
        ),

        "important_dates": (
            document_analysis.important_dates
        ),

        "parties": (
            document_analysis.parties
        ),

        "created_at": (
            document_analysis.created_at
        ),

        "updated_at": (
            document_analysis.updated_at
        ),

        "disclaimer": (
            "This analysis is generated by an "
            "automated system for informational "
            "purposes and should not be treated "
            "as legal advice."
        ),
    }


# =========================================================
# DOCUMENT QUESTION & ANSWER
# =========================================================

@router.post(
    "/{document_id}/ask",
    status_code=status.HTTP_200_OK,
)
def ask_document_question(
    document_id: int,
    request: DocumentQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ask a question about the uploaded legal document.

    The answer is generated from the extracted text
    belonging to the authenticated user's document.
    """

    # =====================================================
    # FIND DOCUMENT
    # =====================================================

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # =====================================================
    # CHECK EXTRACTED TEXT
    # =====================================================

    if not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No extracted text is available "
                "for this document."
            ),
        )

    # =====================================================
    # CLEAN QUESTION
    # =====================================================

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a question.",
        )

    # =====================================================
    # ANSWER QUESTION
    # =====================================================

    try:

        result = answer_document_question(
            document.extracted_text,
            question,
        )

    except Exception as exc:

        print(
            "DOCUMENT Q&A ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to answer the question: "
                f"{str(exc)}"
            ),
        ) from exc

    # =====================================================
    # RETURN ANSWER
    # =====================================================

    return {
        "document_id": document.id,

        "filename": document.filename,

        "question": question,

        "answer": result["answer"],

        "source_context": result["source_context"],

        "source": "Uploaded document",

        "disclaimer": (
            "This answer is generated from the "
            "uploaded document for informational "
            "purposes only and should not be treated "
            "as legal advice."
        ),
    }