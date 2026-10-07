from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class DocumentTranslation(Base):
    __tablename__ = "document_translations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    document_id = Column(
        Integer,
        ForeignKey(
            "documents.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    target_language = Column(
        String(50),
        nullable=False,
        index=True
    )

    language_code = Column(
        String(10),
        nullable=False
    )

    translated_text = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # =====================================================
    # DOCUMENT RELATIONSHIP
    # =====================================================

    document = relationship(
        "Document",
        back_populates="translations"
    )