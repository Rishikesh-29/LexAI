import re


def clean_text(text: str) -> str:
    """Clean unnecessary whitespace from extracted text."""
    return re.sub(r"\s+", " ", text).strip()


def split_sentences(text: str) -> list[str]:
    """Split legal text into sentences."""
    cleaned = clean_text(text)

    if not cleaned:
        return []

    return re.split(r"(?<=[.!?])\s+", cleaned)


def generate_summary(text: str) -> str:
    """
    Generate a first-stage extractive legal summary.

    This is currently rule-based and can later be replaced
    with an LLM such as Gemini/OpenAI.
    """

    sentences = split_sentences(text)

    if not sentences:
        return "No text available for analysis."

    keywords = [
        "agreement",
        "payment",
        "termination",
        "confidential",
        "obligation",
        "shall",
        "must",
        "right",
        "responsible",
        "liable",
        "notice",
        "contract",
    ]

    important_sentences = []

    for sentence in sentences:
        sentence_lower = sentence.lower()

        if any(keyword in sentence_lower for keyword in keywords):
            important_sentences.append(sentence)

    if not important_sentences:
        important_sentences = sentences[:3]

    return " ".join(important_sentences[:5])


def identify_key_clauses(text: str) -> list[str]:
    """Identify common legal clauses."""

    text_lower = text.lower()

    clause_patterns = {
        "Payment Clause": [
            "payment",
            "invoice",
            "fee",
            "pay",
        ],
        "Termination Clause": [
            "termination",
            "terminate",
            "notice",
        ],
        "Confidentiality Clause": [
            "confidential",
            "confidentiality",
            "private information",
        ],
        "Obligation Clause": [
            "shall",
            "must",
            "agrees to",
            "agreed to",
        ],
        "Service Clause": [
            "service",
            "services",
            "deliver",
            "provider",
        ],
    }

    clauses = []

    for clause_name, keywords in clause_patterns.items():
        if any(keyword in text_lower for keyword in keywords):
            clauses.append(clause_name)

    return clauses


def identify_rights_and_obligations(text: str) -> dict:
    """Extract basic rights and obligations."""

    sentences = split_sentences(text)

    rights = []
    obligations = []

    for sentence in sentences:

        sentence_lower = sentence.lower()

        if any(
            keyword in sentence_lower
            for keyword in [
                "right",
                "may",
                "may terminate",
                "entitled",
            ]
        ):
            rights.append(sentence)

        if any(
            keyword in sentence_lower
            for keyword in [
                "shall",
                "must",
                "agrees to",
                "agreed to",
                "pay",
                "keep confidential",
                "responsible",
            ]
        ):
            obligations.append(sentence)

    return {
        "rights": rights,
        "obligations": obligations,
    }


def identify_risks(text: str) -> list[str]:
    """
    Identify potentially important legal risks or areas
    that deserve human/legal review.
    """

    text_lower = text.lower()

    risks = []

    if "termination" in text_lower:
        risks.append(
            "Termination conditions are present. "
            "Review the notice period and termination rights."
        )

    if "payment" in text_lower or "invoice" in text_lower:
        risks.append(
            "Payment obligations are present. "
            "Review payment deadlines, fees and consequences of non-payment."
        )

    if "confidential" in text_lower:
        risks.append(
            "Confidentiality obligations are present. "
            "Review what information is protected and how long confidentiality applies."
        )

    if "liable" in text_lower or "liability" in text_lower:
        risks.append(
            "Liability provisions are present. "
            "Review responsibility for losses, damages and limitations."
        )

    if "penalty" in text_lower or "fine" in text_lower:
        risks.append(
            "Penalty-related language was detected. "
            "Review the conditions and amount of any penalties."
        )

    if "dispute" in text_lower or "arbitration" in text_lower:
        risks.append(
            "Dispute-resolution provisions are present. "
            "Review jurisdiction, arbitration and dispute procedures."
        )

    if not risks:
        risks.append(
            "No major predefined risk patterns were detected. "
            "The document should still be reviewed by a qualified legal professional."
        )

    return risks


def identify_relevant_laws(text: str) -> list[dict]:
    """
    Preliminary rule-based identification of potentially
    relevant Indian legal frameworks.

    This is NOT legal advice and should later be replaced
    with an AI/legal knowledge system.
    """

    text_lower = text.lower()

    laws = []

    if any(
        word in text_lower
        for word in [
            "agreement",
            "contract",
            "service agreement",
            "breach",
        ]
    ):
        laws.append({
            "law": "Indian Contract Act, 1872",
            "reason": "The document contains agreement/contract-related terms."
        })

    if any(
        word in text_lower
        for word in [
            "electronic",
            "digital",
            "online",
            "computer",
            "electronic record",
        ]
    ):
        laws.append({
            "law": "Information Technology Act, 2000",
            "reason": "The document contains electronic or digital transaction-related terms."
        })

    if any(
        word in text_lower
        for word in [
            "personal data",
            "personal information",
            "data protection",
            "privacy",
        ]
    ):
        laws.append({
            "law": "Digital Personal Data Protection Act, 2023",
            "reason": "The document contains personal-data or privacy-related terms."
        })

    if not laws:
        laws.append({
            "law": "No specific law confidently identified",
            "reason": "The current rule-based engine did not find sufficient keywords."
        })

    return laws


def analyze_document(text: str) -> dict:
    """
    Complete first-stage LexAI legal analysis.
    """

    return {
        "summary": generate_summary(text),
        "key_clauses": identify_key_clauses(text),
        "rights_and_obligations": identify_rights_and_obligations(text),
        "risks": identify_risks(text),
        "relevant_laws": identify_relevant_laws(text),
    }