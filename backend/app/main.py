from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.api.documents import router as documents_router
from app.api.analysis import router as analysis_router
from app.api.translation import router as translation_router
from app.api.lawyers import router as lawyers_router
from app.api.voice import router as voice_router
from app.api.reports import router as reports_router

from app.database.database import Base, engine

# Import all models so SQLAlchemy knows about all tables
from app.models import (
    User,
    Document,
    DocumentAnalysis,
    DocumentTranslation,
    Lawyer,
)


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="LexAI",
    description="AI Powered Legal Document Intelligence Platform",
    version="1.0.0",
)


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REGISTER API ROUTERS
# =========================================================

# Authentication
app.include_router(auth_router)

# Document upload and management
app.include_router(documents_router)

# AI Legal Analysis
app.include_router(analysis_router)

# Translation
app.include_router(translation_router)

# Lawyer Finder
app.include_router(lawyers_router)

# Voice Assistant
app.include_router(voice_router)

# Legal Report Generation
app.include_router(reports_router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def home():
    return {
        "project": "LexAI",
        "database": "Connected Successfully",
        "message": "Backend Running 🚀",
        "version": "1.0.0",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "LexAI Backend",
    }