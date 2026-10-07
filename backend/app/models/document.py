from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    filename = Column(
        String(255),
        nullable=False
    )

    file_type = Column(
        String(50),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    extracted_text = Column(
        Text,
        nullable=True
    )

    uploaded_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    status = Column(
        String(50),
        default="uploaded",
        nullable=False
    )

    # =====================================================
    # USER RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        back_populates="documents"
    )

    # =====================================================
    # AI ANALYSIS RELATIONSHIP
    # =====================================================

    analysis = relationship(
        "DocumentAnalysis",
        back_populates="document",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # =====================================================
    # TRANSLATION RELATIONSHIP
    # =====================================================

    translations = relationship(
        "DocumentTranslation",
        back_populates="document",
        cascade="all, delete-orphan"
    )