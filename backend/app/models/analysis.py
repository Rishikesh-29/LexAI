from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    summary = Column(
        Text,
        nullable=True
    )

    key_clauses = Column(
        JSON,
        nullable=True
    )

    rights = Column(
        JSON,
        nullable=True
    )

    obligations = Column(
        JSON,
        nullable=True
    )

    risks = Column(
        JSON,
        nullable=True
    )

    relevant_laws = Column(
        JSON,
        nullable=True
    )

    important_dates = Column(
        JSON,
        nullable=True
    )

    parties = Column(
        JSON,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    document = relationship(
        "Document",
        back_populates="analysis"
    )