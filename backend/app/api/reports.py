from io import BytesIO
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.document import Document
from app.models.analysis import DocumentAnalysis
from app.models.user import User


router = APIRouter(
    prefix="/reports",
    tags=["Legal Reports"],
)


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def safe_text(value):
    """
    Convert database values into readable PDF text.
    """
    if value is None:
        return "Not available"

    if isinstance(value, list):
        if not value:
            return "Not available"

        return "\n".join(
            f"• {str(item)}"
            for item in value
        )

    if isinstance(value, dict):
        if not value:
            return "Not available"

        return "\n".join(
            f"• {key}: {value}"
            for key, value in value.items()
        )

    return str(value)


def add_section(
    story,
    title,
    content,
    styles
):
    """
    Add a formatted section to the PDF.
    """

    story.append(
        Paragraph(
            title,
            styles["SectionTitle"]
        )
    )

    if isinstance(content, list):

        if not content:
            story.append(
                Paragraph(
                    "Not available",
                    styles["BodyTextCustom"]
                )
            )

        else:
            for item in content:

                if isinstance(item, dict):
                    text = "<br/>".join(
                        f"<b>{key}:</b> {value}"
                        for key, value in item.items()
                    )
                else:
                    text = str(item)

                story.append(
                    Paragraph(
                        f"• {text}",
                        styles["BodyTextCustom"]
                    )
                )

                story.append(
                    Spacer(1, 4)
                )

    elif isinstance(content, dict):

        if not content:
            story.append(
                Paragraph(
                    "Not available",
                    styles["BodyTextCustom"]
                )
            )

        else:
            for key, value in content.items():

                story.append(
                    Paragraph(
                        f"<b>{key}:</b> {value}",
                        styles["BodyTextCustom"]
                    )
                )

                story.append(
                    Spacer(1, 4)
                )

    else:

        text = safe_text(content)

        # Convert line breaks to PDF line breaks
        text = text.replace(
            "\n",
            "<br/>"
        )

        story.append(
            Paragraph(
                text,
                styles["BodyTextCustom"]
            )
        )

    story.append(
        Spacer(1, 12)
    )


# =========================================================
# GENERATE PDF REPORT
# =========================================================

@router.get(
    "/{document_id}/pdf"
)
def generate_legal_report(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

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
            status_code=404,
            detail="Document not found.",
        )

    # =====================================================
    # FIND ANALYSIS
    # =====================================================

    analysis = (
        db.query(DocumentAnalysis)
        .filter(
            DocumentAnalysis.document_id
            == document.id
        )
        .first()
    )

    if not analysis:

        raise HTTPException(
            status_code=404,
            detail=(
                "Analysis not found for this document. "
                "Please analyze the document first."
            ),
        )

    # =====================================================
    # CREATE PDF BUFFER
    # =====================================================

    buffer = BytesIO()

    document_title = (
        "LexAI Legal Intelligence Report"
    )

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=document_title,
        author="LexAI",
    )

    # =====================================================
    # STYLES
    # =====================================================

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            spaceAfter=8,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ReportSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.grey,
            spaceAfter=18,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            spaceBefore=8,
            spaceAfter=8,
            textColor=colors.HexColor("#17233c"),
        )
    )

    styles.add(
        ParagraphStyle(
            name="BodyTextCustom",
            parent=styles["BodyText"],
            fontSize=10,
            leading=15,
            spaceAfter=4,
        )
    )

    styles.add(
        ParagraphStyle(
            name="Disclaimer",
            parent=styles["BodyText"],
            fontSize=8.5,
            leading=12,
            textColor=colors.grey,
            spaceBefore=10,
        )
    )

    # =====================================================
    # PDF CONTENT
    # =====================================================

    story = []

    # -----------------------------------------------------
    # HEADER
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "⚖️ LexAI",
            styles["ReportTitle"]
        )
    )

    story.append(
        Paragraph(
            "AI Powered Legal Document Intelligence Platform",
            styles["ReportSubtitle"]
        )
    )

    story.append(
        Paragraph(
            "LEGAL INTELLIGENCE REPORT",
            styles["ReportTitle"]
        )
    )

    story.append(
        Spacer(1, 10)
    )

    # -----------------------------------------------------
    # DOCUMENT INFORMATION
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "Document Information",
            styles["SectionTitle"]
        )
    )

    created_date = datetime.now().strftime(
        "%d %B %Y, %I:%M %p"
    )

    document_data = [
        [
            Paragraph("<b>Document ID</b>", styles["BodyTextCustom"]),
            str(document.id),
        ],
        [
            Paragraph("<b>Filename</b>", styles["BodyTextCustom"]),
            str(document.filename),
        ],
        [
            Paragraph("<b>Status</b>", styles["BodyTextCustom"]),
            str(document.status),
        ],
        [
            Paragraph("<b>Report Generated</b>", styles["BodyTextCustom"]),
            created_date,
        ],
    ]

    table = Table(
        document_data,
        colWidths=[
            45 * mm,
            125 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.lightgrey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor("#f1f5f9"),
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(table)
    story.append(Spacer(1, 18))

    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    add_section(
        story,
        "1. AI Generated Summary",
        analysis.summary,
        styles,
    )

    # -----------------------------------------------------
    # KEY CLAUSES
    # -----------------------------------------------------

    add_section(
        story,
        "2. Key Clauses",
        analysis.key_clauses,
        styles,
    )

    # -----------------------------------------------------
    # RIGHTS
    # -----------------------------------------------------

    add_section(
        story,
        "3. Rights",
        analysis.rights,
        styles,
    )

    # -----------------------------------------------------
    # OBLIGATIONS
    # -----------------------------------------------------

    add_section(
        story,
        "4. Obligations",
        analysis.obligations,
        styles,
    )

    # -----------------------------------------------------
    # RISKS
    # -----------------------------------------------------

    add_section(
        story,
        "5. Identified Risks",
        analysis.risks,
        styles,
    )

    # -----------------------------------------------------
    # PARTIES
    # -----------------------------------------------------

    add_section(
        story,
        "6. Parties",
        analysis.parties,
        styles,
    )

    # -----------------------------------------------------
    # IMPORTANT DATES
    # -----------------------------------------------------

    add_section(
        story,
        "7. Important Dates",
        analysis.important_dates,
        styles,
    )

    # -----------------------------------------------------
    # RELEVANT LAWS
    # -----------------------------------------------------

    add_section(
        story,
        "8. Relevant Laws",
        analysis.relevant_laws,
        styles,
    )

    # -----------------------------------------------------
    # DISCLAIMER
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "Legal Disclaimer",
            styles["SectionTitle"]
        )
    )

    story.append(
        Paragraph(
            "This report is generated by an automated "
            "AI-based legal document intelligence system "
            "for informational and educational purposes "
            "only. The analysis should not be treated as "
            "legal advice and does not establish a "
            "lawyer-client relationship. Users should "
            "consult a qualified legal professional for "
            "legal advice concerning their specific "
            "circumstances.",
            styles["Disclaimer"],
        )
    )

    # =====================================================
    # BUILD PDF
    # =====================================================

    pdf.build(story)

    buffer.seek(0)

    # =====================================================
    # FILE NAME
    # =====================================================

    filename = (
        f"LexAI_Report_Document_{document.id}.pdf"
    )

    # =====================================================
    # RETURN PDF
    # =====================================================

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )