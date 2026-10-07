from sqlalchemy import Column, Integer, String, Float, Boolean

from app.database.database import Base


class Lawyer(Base):
    __tablename__ = "lawyers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)
    specialization = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)

    experience_years = Column(Integer, nullable=False, default=0)
    phone = Column(String(20), nullable=True)
    email = Column(String(150), nullable=True)

    rating = Column(Float, nullable=True, default=0.0)
    consultation_fee = Column(Float, nullable=True, default=0.0)

    is_available = Column(Boolean, nullable=False, default=True)