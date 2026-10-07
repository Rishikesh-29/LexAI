from typing import Dict

from langdetect import (
    DetectorFactory,
    LangDetectException,
    detect,
)

from app.services.translation_service import (
    translate_to_english,
)


# ============================================================
# LANGUAGE DETECTION CONFIGURATION
# ============================================================

# Make language detection deterministic.
DetectorFactory.seed = 0


# ============================================================
# SUPPORTED INDIAN LANGUAGES
# ============================================================

INDIAN_LANGUAGE_CODES: Dict[str, str] = {
    "hi": "hindi",
    "bn": "bengali",
    "ta": "tamil",
    "te": "telugu",
    "mr": "marathi",
    "gu": "gujarati",
    "kn": "kannada",
    "ml": "malayalam",
    "pa": "punjabi",
    "or": "odia",
}


# ============================================================
# DETECT DOCUMENT LANGUAGE
# ============================================================

def detect_document_language(text: str) -> str:
    """
    Detect the language of a legal document.

    A maximum of the first 5000 characters is used
    for language detection.
    """

    if not text or not text.strip():
        return "unknown"

    sample = text.strip()[:5000]

    try:
        detected = detect(sample)

        return detected.lower()

    except LangDetectException:
        return "unknown"

    except Exception:
        return "unknown"


# ============================================================
# CHECK SUPPORTED INDIAN LANGUAGE
# ============================================================

def is_supported_indian_language(
    language_code: str,
) -> bool:
    """
    Check whether the detected language is
    one of the supported Indian languages.
    """

    if not language_code:
        return False

    return (
        language_code.strip().lower()
        in INDIAN_LANGUAGE_CODES
    )


# ============================================================
# GET LANGUAGE NAME
# ============================================================

def get_language_name(
    language_code: str,
) -> str:
    """
    Convert a language code into a readable language name.

    Examples:
        ta -> Tamil
        hi -> Hindi
        te -> Telugu
        en -> English
    """

    if not language_code:
        return "Unknown"

    normalized = language_code.strip().lower()

    if normalized == "en":
        return "English"

    return INDIAN_LANGUAGE_CODES.get(
        normalized,
        "Unknown",
    ).title()


# ============================================================
# PREPARE TEXT FOR AI ANALYSIS
# ============================================================

def prepare_text_for_analysis(
    text: str,
) -> Dict[str, str]:
    """
    Prepare extracted document text for AI legal analysis.

    Processing flow:

        Original Document
              |
              v
        Language Detection
              |
        +-----+-----+
        |           |
      English     Indian Language
        |           |
        v           v
    Keep Text   Translate to English
                    |
                    v
              AI Legal Analysis

    The original extracted text is always preserved.

    Only analysis_text is translated when the document
    is written in a supported Indian language.
    """

    # --------------------------------------------------------
    # Validate input
    # --------------------------------------------------------

    if not text or not text.strip():
        raise ValueError(
            "Document text cannot be empty."
        )

    # --------------------------------------------------------
    # Preserve original extracted text
    # --------------------------------------------------------

    original_text = text.strip()

    # --------------------------------------------------------
    # Detect document language
    # --------------------------------------------------------

    detected_language = detect_document_language(
        original_text
    )

    # ========================================================
    # CASE 1: ENGLISH DOCUMENT
    # ========================================================

    if detected_language == "en":

        return {
            "original_text": original_text,
            "analysis_text": original_text,
            "detected_language": "en",
            "detected_language_name": "English",
            "was_translated": "false",
        }

    # ========================================================
    # CASE 2: SUPPORTED INDIAN LANGUAGE
    # ========================================================

    if is_supported_indian_language(
        detected_language
    ):

        language_name = get_language_name(
            detected_language
        )

        # ----------------------------------------------------
        # IMPORTANT:
        #
        # MyMemory does NOT support:
        #
        #     auto|en
        #
        # Therefore we pass the actual detected language:
        #
        #     ta|en
        #     hi|en
        #     te|en
        #     etc.
        # ----------------------------------------------------

        translated_text = translate_to_english(
            original_text,
            detected_language,
        )

        return {
            "original_text": original_text,
            "analysis_text": translated_text,
            "detected_language": detected_language,
            "detected_language_name": language_name,
            "was_translated": "true",
        }

    # ========================================================
    # CASE 3: UNSUPPORTED / UNKNOWN LANGUAGE
    # ========================================================

    return {
        "original_text": original_text,
        "analysis_text": original_text,
        "detected_language": detected_language,
        "detected_language_name": get_language_name(
            detected_language
        ),
        "was_translated": "false",
    }