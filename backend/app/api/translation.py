from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.document import Document
from app.models.translation import DocumentTranslation
from app.models.user import User
from app.services.translation_service import (
    SUPPORTED_LANGUAGES,
    translate_text,
)


router = APIRouter(
    prefix="/documents",
    tags=["Translation"],
)


# =========================================================
# REQUEST SCHEMA
# =========================================================

class TranslationRequest(BaseModel):
    language: str


# =========================================================
# GET SUPPORTED LANGUAGES
# =========================================================

@router.get(
    "/translation/languages",
    status_code=status.HTTP_200_OK,
)
def get_supported_languages(
    current_user: User = Depends(get_current_user),
):
    """
    Return supported Indian languages.
    """

    return {
        "languages": [
            {
                "name": language,
                "code": code,
            }
            for language, code in SUPPORTED_LANGUAGES.items()
        ]
    }


# =========================================================
# TRANSLATE DOCUMENT
# =========================================================

@router.post(
    "/{document_id}/translate",
    status_code=status.HTTP_201_CREATED,
)
def translate_document(
    document_id: int,
    request: TranslationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Translate a user's document and save the translation.
    """

    # -----------------------------------------------------
    # FIND DOCUMENT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CHECK EXTRACTED TEXT
    # -----------------------------------------------------

    if not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extracted text available for translation.",
        )

    # -----------------------------------------------------
    # VALIDATE LANGUAGE
    # -----------------------------------------------------

    language = request.language.strip().lower()

    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Unsupported language.",
                "supported_languages": list(
                    SUPPORTED_LANGUAGES.keys()
                ),
            },
        )

    language_code = SUPPORTED_LANGUAGES[language]

    # -----------------------------------------------------
    # TRANSLATE DOCUMENT
    # -----------------------------------------------------

    try:
        translated_text = translate_text(
            document.extracted_text,
            language,
        )

        if not translated_text:
            raise ValueError(
                "Translation service returned empty text."
            )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        # Keep the original exception visible in the backend
        # terminal during development.
        print(
            f"TRANSLATION ERROR for document {document_id}: "
            f"{type(exc).__name__}: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(exc)}",
        ) from exc

    # -----------------------------------------------------
    # SAVE TRANSLATION
    # -----------------------------------------------------

    translation = DocumentTranslation(
        document_id=document.id,
        target_language=language,
        language_code=language_code,
        translated_text=translated_text,
    )

    db.add(translation)

    try:
        db.commit()
        db.refresh(translation)

    except Exception as exc:
        db.rollback()

        print(
            f"TRANSLATION DATABASE ERROR: "
            f"{type(exc).__name__}: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save translation: {str(exc)}",
        ) from exc

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "translation_id": translation.id,
        "document_id": document.id,
        "filename": document.filename,
        "source_language": "auto",
        "target_language": language,
        "language_code": language_code,
        "translated_text": translation.translated_text,
        "created_at": translation.created_at,
        "message": "Document translated and saved successfully.",
    }


# =========================================================
# GET DOCUMENT TRANSLATIONS
# =========================================================

@router.get(
    "/{document_id}/translations",
    status_code=status.HTTP_200_OK,
)
def get_document_translations(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all saved translations for a document.
    """

    # -----------------------------------------------------
    # CHECK DOCUMENT OWNERSHIP
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # GET TRANSLATIONS
    # -----------------------------------------------------

    translations = (
        db.query(DocumentTranslation)
        .filter(
            DocumentTranslation.document_id == document.id
        )
        .order_by(
            DocumentTranslation.created_at.desc()
        )
        .all()
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "document_id": document.id,
        "filename": document.filename,
        "count": len(translations),
        "translations": [
            {
                "translation_id": translation.id,
                "target_language": translation.target_language,
                "language_code": translation.language_code,
                "translated_text": translation.translated_text,
                "created_at": translation.created_at,
            }
            for translation in translations
        ],
    }