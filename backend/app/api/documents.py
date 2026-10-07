from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.document import Document
from app.models.user import User
from app.services.document_service import (
    UPLOAD_DIR,
    extract_text,
    is_allowed_file,
)


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a legal document.

    Supported formats:
    - PDF
    - DOCX
    - TXT

    Process:
    1. Validate file
    2. Save file
    3. Extract text
    4. Store document in PostgreSQL
    """

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOCX and TXT files are supported.",
        )

    extension = Path(file.filename).suffix.lower()

    unique_filename = f"{uuid4().hex}{extension}"

    file_path = UPLOAD_DIR / unique_filename

    try:

        file_content = await file.read()

        if not file_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        file_path.write_bytes(file_content)

        extracted_text = extract_text(file_path)

        if not extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No readable text could be extracted from the document.",
            )

        document = Document(
            user_id=current_user.id,
            filename=file.filename,
            file_type=extension,
            file_path=str(file_path),
            extracted_text=extracted_text,
            status="processed",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return {
            "id": document.id,
            "filename": document.filename,
            "file_type": document.file_type,
            "status": document.status,
            "message": "Document uploaded and text extracted successfully.",
            "extracted_text": document.extracted_text,
            "uploaded_at": document.uploaded_at,
        }

    except ValueError as exc:

        if file_path.exists():
            file_path.unlink()

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except HTTPException:

        if file_path.exists():
            file_path.unlink()

        db.rollback()

        raise

    except Exception as exc:

        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process document.",
        ) from exc


# =========================================================
# GET USER DOCUMENTS
# =========================================================

@router.get("/")
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all documents uploaded by the authenticated user.
    """

    documents = (
        db.query(Document)
        .filter(
            Document.user_id == current_user.id
        )
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    return {
        "count": len(documents),
        "documents": [
            {
                "id": document.id,
                "filename": document.filename,
                "file_type": document.file_type,
                "status": document.status,
                "uploaded_at": document.uploaded_at,
            }
            for document in documents
        ],
    }


# =========================================================
# GET SINGLE DOCUMENT
# =========================================================

@router.get("/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific document belonging to the logged-in user.
    """

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

    return {
        "id": document.id,
        "filename": document.filename,
        "file_type": document.file_type,
        "status": document.status,
        "extracted_text": document.extracted_text,
        "uploaded_at": document.uploaded_at,
    }