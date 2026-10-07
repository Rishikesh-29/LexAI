from typing import Dict
import requests


# ============================================================
# SUPPORTED LANGUAGES
# ============================================================

SUPPORTED_LANGUAGES: Dict[str, str] = {
    "hindi": "hi",
    "bengali": "bn",
    "tamil": "ta",
    "telugu": "te",
    "marathi": "mr",
    "gujarati": "gu",
    "kannada": "kn",
    "malayalam": "ml",
    "punjabi": "pa",
    "odia": "or",
}


# ============================================================
# CONFIGURATION
# ============================================================

# MyMemory has a maximum query length of 500 characters.
# 450 gives us a safe margin.
MAX_CHUNK_SIZE = 450

MYMEMORY_URL = "https://api.mymemory.translated.net/get"


# ============================================================
# GET SUPPORTED LANGUAGES
# ============================================================

def get_supported_languages() -> Dict[str, str]:
    """
    Return supported Indian languages
    and their ISO language codes.
    """

    return SUPPORTED_LANGUAGES.copy()


# ============================================================
# GET LANGUAGE CODE
# ============================================================

def get_language_code(language: str) -> str:
    """
    Convert a language name into its ISO language code.

    Example:
        tamil -> ta
        hindi -> hi
        malayalam -> ml
    """

    if not language or not language.strip():
        raise ValueError("Target language is required.")

    normalized_language = language.strip().lower()

    if normalized_language not in SUPPORTED_LANGUAGES:
        raise ValueError(
            f"Unsupported language: {language}"
        )

    return SUPPORTED_LANGUAGES[normalized_language]


# ============================================================
# SPLIT TEXT INTO CHUNKS
# ============================================================

def split_text_into_chunks(
    text: str,
    max_size: int = MAX_CHUNK_SIZE,
) -> list[str]:
    """
    Split long text into chunks that remain below
    the MyMemory query length limit.

    The function tries to preserve:
    1. Paragraphs
    2. Sentences
    3. Words
    """

    if not text or not text.strip():
        return []

    text = text.strip()

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    paragraphs = text.split("\n")

    chunks: list[str] = []
    current_chunk = ""

    for paragraph in paragraphs:

        paragraph = paragraph.strip()

        if not paragraph:
            continue

        # ----------------------------------------------------
        # Paragraph fits in current chunk
        # ----------------------------------------------------

        if len(current_chunk) + len(paragraph) + 1 <= max_size:

            if current_chunk:
                current_chunk += "\n" + paragraph
            else:
                current_chunk = paragraph

            continue

        # ----------------------------------------------------
        # Save current chunk
        # ----------------------------------------------------

        if current_chunk:
            chunks.append(current_chunk)
            current_chunk = ""

        # ----------------------------------------------------
        # Paragraph itself is too large
        # ----------------------------------------------------

        if len(paragraph) > max_size:

            words = paragraph.split()
            temporary = ""

            for word in words:

                # ------------------------------------------------
                # Extremely long single word
                # ------------------------------------------------

                if len(word) > max_size:

                    if temporary:
                        chunks.append(temporary)
                        temporary = ""

                    # Hard split very long word
                    for i in range(0, len(word), max_size):
                        part = word[i:i + max_size]

                        if len(part) == max_size:
                            chunks.append(part)
                        else:
                            temporary = part

                    continue

                # ------------------------------------------------
                # Add word if it fits
                # ------------------------------------------------

                if len(temporary) + len(word) + 1 <= max_size:

                    if temporary:
                        temporary += " " + word
                    else:
                        temporary = word

                else:

                    if temporary:
                        chunks.append(temporary)

                    temporary = word

            if temporary:
                current_chunk = temporary

        else:
            current_chunk = paragraph

    # --------------------------------------------------------
    # Save final chunk
    # --------------------------------------------------------

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


# ============================================================
# TRANSLATE ONE CHUNK
# ============================================================

def translate_chunk(
    text: str,
    source_language_code: str,
    target_language_code: str,
) -> str:
    """
    Translate one chunk using MyMemory.
    """

    if not text or not text.strip():
        return ""

    text = text.strip()

    # Safety check before sending request
    if len(text) > MAX_CHUNK_SIZE:
        raise ValueError(
            f"Translation chunk is too large: "
            f"{len(text)} characters. "
            f"Maximum allowed is {MAX_CHUNK_SIZE}."
        )

    source_language_code = (
        source_language_code.strip().lower()
    )

    target_language_code = (
        target_language_code.strip().lower()
    )

    if source_language_code == "auto":
        raise ValueError(
            "MyMemory requires a specific source language code."
        )

    params = {
        "q": text,
        "langpair": (
            f"{source_language_code}|"
            f"{target_language_code}"
        ),
    }

    try:

        response = requests.get(
            MYMEMORY_URL,
            params=params,
            timeout=30,
        )

        response.raise_for_status()

        data = response.json()

    except requests.RequestException as exc:

        raise RuntimeError(
            "Translation service is currently unavailable."
        ) from exc

    except ValueError as exc:

        raise RuntimeError(
            "Translation service returned invalid data."
        ) from exc

    # --------------------------------------------------------
    # Check MyMemory response
    # --------------------------------------------------------

    response_status = data.get("responseStatus")

    if response_status != 200:

        details = data.get(
            "responseDetails",
            "Unknown translation error.",
        )

        raise RuntimeError(
            f"Translation failed: {details}"
        )

    # --------------------------------------------------------
    # Extract translated text
    # --------------------------------------------------------

    translated = (
        data.get("responseData", {})
        .get("translatedText")
    )

    if not translated:

        raise RuntimeError(
            "Translation provider returned empty text."
        )

    return translated


# ============================================================
# TRANSLATE DOCUMENT TO USER SELECTED LANGUAGE
# ============================================================

def translate_text(
    text: str,
    target_language: str,
) -> str:
    """
    Translate document text into a selected
    Indian language.

    Long documents are automatically divided
    into safe MyMemory-sized chunks.
    """

    if not text or not text.strip():
        raise ValueError(
            "Text cannot be empty."
        )

    # --------------------------------------------------------
    # Get target language code
    # --------------------------------------------------------

    target_language_code = get_language_code(
        target_language
    )

    # --------------------------------------------------------
    # Split document
    # --------------------------------------------------------

    chunks = split_text_into_chunks(
        text,
        MAX_CHUNK_SIZE,
    )

    if not chunks:
        raise ValueError(
            "No translatable text found."
        )

    translated_chunks: list[str] = []

    # --------------------------------------------------------
    # Translate every chunk
    # --------------------------------------------------------

    for index, chunk in enumerate(chunks, start=1):

        print(
            f"Translating chunk {index}/{len(chunks)} "
            f"({len(chunk)} characters)..."
        )

        translated_chunk = translate_chunk(
            chunk,
            "en",
            target_language_code,
        )

        translated_chunks.append(
            translated_chunk
        )

    # --------------------------------------------------------
    # Combine translated chunks
    # --------------------------------------------------------

    return "\n\n".join(
        translated_chunks
    )


# ============================================================
# TRANSLATE DOCUMENT TO ENGLISH
# ============================================================

def translate_to_english(
    text: str,
    source_language_code: str,
) -> str:
    """
    Translate document text into English.

    Used by the multilingual legal-analysis pipeline.
    """

    if not text or not text.strip():
        raise ValueError(
            "Text cannot be empty."
        )

    if not source_language_code:
        raise ValueError(
            "Source language code is required."
        )

    source_language_code = (
        source_language_code.strip().lower()
    )

    if source_language_code == "auto":
        raise ValueError(
            "A specific source language code is required "
            "for translation to English."
        )

    # --------------------------------------------------------
    # Split document
    # --------------------------------------------------------

    chunks = split_text_into_chunks(
        text,
        MAX_CHUNK_SIZE,
    )

    if not chunks:
        raise ValueError(
            "No translatable text found."
        )

    translated_chunks: list[str] = []

    # --------------------------------------------------------
    # Translate every chunk
    # --------------------------------------------------------

    for index, chunk in enumerate(chunks, start=1):

        print(
            f"Translating to English - "
            f"chunk {index}/{len(chunks)} "
            f"({len(chunk)} characters)..."
        )

        translated_chunk = translate_chunk(
            chunk,
            source_language_code,
            "en",
        )

        translated_chunks.append(
            translated_chunk
        )

    # --------------------------------------------------------
    # Combine translated chunks
    # --------------------------------------------------------

    return "\n\n".join(
        translated_chunks
    )