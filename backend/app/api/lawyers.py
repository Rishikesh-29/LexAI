from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.lawyer import Lawyer
from app.models.user import User


router = APIRouter(
    prefix="/lawyers",
    tags=["Lawyer Finder"],
)


@router.get("/")
def get_all_lawyers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lawyers = (
        db.query(Lawyer)
        .order_by(Lawyer.rating.desc())
        .all()
    )

    return {
        "count": len(lawyers),
        "lawyers": [
            {
                "id": lawyer.id,
                "name": lawyer.name,
                "specialization": lawyer.specialization,
                "city": lawyer.city,
                "state": lawyer.state,
                "experience_years": lawyer.experience_years,
                "phone": lawyer.phone,
                "email": lawyer.email,
                "rating": lawyer.rating,
                "consultation_fee": lawyer.consultation_fee,
                "is_available": lawyer.is_available,
            }
            for lawyer in lawyers
        ],
    }


@router.get("/search")
def search_lawyers(
    city: Optional[str] = Query(
        default=None,
        description="Filter lawyers by city",
    ),
    specialization: Optional[str] = Query(
        default=None,
        description="Filter lawyers by legal specialization",
    ),
    available_only: bool = Query(
        default=False,
        description="Show only currently available lawyers",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Lawyer)

    if city:
        query = query.filter(
            Lawyer.city.ilike(f"%{city}%")
        )

    if specialization:
        query = query.filter(
            Lawyer.specialization.ilike(f"%{specialization}%")
        )

    if available_only:
        query = query.filter(
            Lawyer.is_available == True
        )

    lawyers = (
        query
        .order_by(Lawyer.rating.desc())
        .all()
    )

    return {
        "count": len(lawyers),
        "filters": {
            "city": city,
            "specialization": specialization,
            "available_only": available_only,
        },
        "lawyers": [
            {
                "id": lawyer.id,
                "name": lawyer.name,
                "specialization": lawyer.specialization,
                "city": lawyer.city,
                "state": lawyer.state,
                "experience_years": lawyer.experience_years,
                "phone": lawyer.phone,
                "email": lawyer.email,
                "rating": lawyer.rating,
                "consultation_fee": lawyer.consultation_fee,
                "is_available": lawyer.is_available,
            }
            for lawyer in lawyers
        ],
    }


@router.get("/{lawyer_id}")
def get_lawyer(
    lawyer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lawyer = (
        db.query(Lawyer)
        .filter(Lawyer.id == lawyer_id)
        .first()
    )

    if not lawyer:
        raise HTTPException(
            status_code=404,
            detail="Lawyer not found.",
        )

    return {
        "id": lawyer.id,
        "name": lawyer.name,
        "specialization": lawyer.specialization,
        "city": lawyer.city,
        "state": lawyer.state,
        "experience_years": lawyer.experience_years,
        "phone": lawyer.phone,
        "email": lawyer.email,
        "rating": lawyer.rating,
        "consultation_fee": lawyer.consultation_fee,
        "is_available": lawyer.is_available,
    }
