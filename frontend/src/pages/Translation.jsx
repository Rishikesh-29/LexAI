import { useEffect, useState } from "react";
import api from "../services/api";

function Translation({ documentId: initialDocumentId }) {
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState(
    initialDocumentId ? String(initialDocumentId) : ""
  );

  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState("");

  const [translation, setTranslation] = useState(null);
  const [translations, setTranslations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingLanguages, setLoadingLanguages] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // LANGUAGE MAP
  // =========================================================

  const languageMap = {
    en: "english",
    hi: "hindi",
    ta: "tamil",
    te: "telugu",
    ml: "malayalam",
    kn: "kannada",
    bn: "bengali",
    mr: "marathi",
    gu: "gujarati",
    pa: "punjabi",
    ur: "urdu",
    or: "odia",
    od: "odia",
    as: "assamese",
  };

  // =========================================================
  // ERROR HANDLER
  // =========================================================

  const getErrorMessage = (err, fallback) => {
    if (!err) {
      return fallback;
    }

    const detail = err.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item && typeof item === "object") {
            return (
              item.msg ||
              item.message ||
              JSON.stringify(item)
            );
          }

          return String(item);
        })
        .join(", ");
    }

    if (detail && typeof detail === "object") {
      return (
        detail.msg ||
        detail.message ||
        JSON.stringify(detail)
      );
    }

    if (typeof err.response?.data === "string") {
      return err.response.data;
    }

    return fallback;
  };

  // =========================================================
  // LOAD DOCUMENTS
  // =========================================================

  const loadDocuments = async () => {
    try {
      const response = await api.get("/documents/");

      const docs = response.data?.documents || [];

      setDocuments(docs);

      if (
        initialDocumentId &&
        docs.some(
          (doc) =>
            String(doc.id) === String(initialDocumentId)
        )
      ) {
        setDocumentId(String(initialDocumentId));
      } else if (!documentId && docs.length > 0) {
        setDocumentId(String(docs[0].id));
      }
    } catch (err) {
      console.error("Failed to load documents:", err);

      setError(
        err.response?.status === 401
          ? "Your session has expired. Please login again."
          : getErrorMessage(
              err,
              "Failed to load documents."
            )
      );
    }
  };

  // =========================================================
  // LOAD LANGUAGES
  // =========================================================

  const loadLanguages = async () => {
    try {
      setLoadingLanguages(true);

      const response = await api.get(
        "/documents/translation/languages"
      );

      const data = response.data;

      let languageList = [];

      if (Array.isArray(data)) {
        languageList = data;
      } else if (Array.isArray(data?.languages)) {
        languageList = data.languages;
      }

      setLanguages(languageList);

      if (languageList.length > 0 && !language) {
        const first = languageList[0];

        if (typeof first === "string") {
          setLanguage(first);
        } else {
          setLanguage(
            first?.code ||
              first?.value ||
              first?.name ||
              ""
          );
        }
      }
    } catch (err) {
      console.error("Failed to load languages:", err);

      setError(
        err.response?.status === 401
          ? "Your session has expired. Please login again."
          : getErrorMessage(
              err,
              "Failed to load supported languages."
            )
      );
    } finally {
      setLoadingLanguages(false);
    }
  };

  // =========================================================
  // LANGUAGE HELPERS
  // =========================================================

  const getLanguageName = (item) => {
    if (typeof item === "string") {
      return item;
    }

    if (item && typeof item === "object") {
      return (
        item.name ||
        item.label ||
        item.language ||
        item.code ||
        item.value ||
        "Language"
      );
    }

    return "Language";
  };

  const getLanguageValue = (item) => {
    if (typeof item === "string") {
      return item;
    }

    if (item && typeof item === "object") {
      return (
        item.code ||
        item.value ||
        item.name ||
        ""
      );
    }

    return "";
  };

  const getBackendLanguage = (selectedLanguage) => {
    const normalized = String(
      selectedLanguage || ""
    )
      .trim()
      .toLowerCase();

    return languageMap[normalized] || normalized;
  };

  // =========================================================
  // LOAD SAVED TRANSLATIONS
  // =========================================================

  const loadTranslations = async (id) => {
    if (!id) {
      setTranslations([]);
      return;
    }

    try {
      const response = await api.get(
        `/documents/${id}/translations`
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setTranslations(data);
      } else if (Array.isArray(data?.translations)) {
        setTranslations(data.translations);
      } else {
        setTranslations([]);
      }
    } catch (err) {
      console.error(
        "Failed to load translations:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status !== 404) {
        setError(
          getErrorMessage(
            err,
            "Failed to load previous translations."
          )
        );
      }
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDocuments();
    loadLanguages();
  }, []);

  // =========================================================
  // LOAD HISTORY WHEN DOCUMENT CHANGES
  // =========================================================

  useEffect(() => {
    if (documentId) {
      loadTranslations(documentId);
    }
  }, [documentId]);

  // =========================================================
  // TRANSLATE DOCUMENT
  // =========================================================

  const handleTranslate = async () => {
    if (!documentId) {
      setError("Please select a document.");
      return;
    }

    if (!language) {
      setError("Please select a target language.");
      return;
    }

    const backendLanguage =
      getBackendLanguage(language);

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setTranslation(null);

      const response = await api.post(
        `/documents/${documentId}/translate`,
        {
          language: backendLanguage,
        }
      );

      setTranslation(response.data);

      setMessage(
        "Document translated and saved successfully."
      );

      await loadTranslations(documentId);
    } catch (err) {
      console.error(
        "Translation failed:",
        err
      );

      setError(
        err.response?.status === 401
          ? "Your session has expired. Please login again."
          : getErrorMessage(
              err,
              "Translation failed. Please try again."
            )
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GET TRANSLATED TEXT
  // =========================================================

  const getTranslatedText = (item = translation) => {
    if (!item) {
      return "";
    }

    const possibleValues = [
      item.translated_text,
      item.translation,
      item.translated_content,
      item.text,
      item.content,
    ];

    for (const value of possibleValues) {
      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value;
      }
    }

    return "";
  };

  // =========================================================
  // GET TRANSLATION LANGUAGE
  // =========================================================

  const getTranslationLanguage = (item = translation) => {
    if (item) {
      const value =
        item.target_language ||
        item.language ||
        item.targetLanguage;

      if (typeof value === "string") {
        return value;
      }
    }

    const selectedItem = languages.find(
      (languageItem) =>
        getLanguageValue(languageItem) === language
    );

    return getLanguageName(
      selectedItem || language
    );
  };

  // =========================================================
  // GET DOCUMENT NAME
  // =========================================================

  const getDocumentName = (id) => {
    const doc = documents.find(
      (item) => String(item.id) === String(id)
    );

    return doc?.filename || `Document #${id}`;
  };

  // =========================================================
  // VIEW SAVED TRANSLATION
  // =========================================================

  const handleViewTranslation = (item) => {
    setTranslation({
      ...item,
      filename:
        item.filename ||
        getDocumentName(
          item.document_id || documentId
        ),
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DOWNLOAD TRANSLATION
  // =========================================================

  const handleDownloadTranslation = (item = translation) => {
    const translatedText = getTranslatedText(item);

    if (!translatedText) {
      setError(
        "No translated text is available for download."
      );
      return;
    }

    const language = getTranslationLanguage(item);
    const docId =
      item?.document_id || documentId;

    const originalName = getDocumentName(docId);

    const baseName = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/[<>:"/\\|?*]+/g, "_");

    const safeLanguage = String(language)
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    const fileName =
      `${baseName}_${safeLanguage}_translation.txt`;

    const blob = new Blob(
      [translatedText],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setMessage(
      "Translated document downloaded successfully."
    );
  };

  // =========================================================
  // COPY TRANSLATION
  // =========================================================

  const handleCopyTranslation = async (
    item = translation
  ) => {
    const translatedText =
      getTranslatedText(item);

    if (!translatedText) {
      setError(
        "No translated text is available to copy."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        translatedText
      );

      setMessage(
        "Translated text copied to clipboard."
      );
    } catch (err) {
      console.error(
        "Copy failed:",
        err
      );

      setError(
        "Unable to copy the translated text."
      );
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="translation-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="translation-header">
        <div>
          <p className="page-eyebrow">
            MULTILINGUAL LEGAL ASSISTANCE
          </p>

          <h1>
            Legal Translation
          </h1>

          <p className="translation-subtitle">
            Translate your legal documents
            into supported Indian languages
            while keeping the original
            document unchanged.
          </p>
        </div>

        <div className="translation-language-badge">
          🌐 Indian Languages
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="translation-alert error">
          ⚠️ {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {message && (
        <div className="translation-alert success">
          ✓ {message}
        </div>
      )}

      {/* =====================================================
          TRANSLATION FORM
      ===================================================== */}

      <div className="translation-card">

        <div className="translation-card-title">

          <div className="translation-icon">
            📄
          </div>

          <div>
            <h2>
              Translate a Legal Document
            </h2>

            <p>
              Select a processed document
              and choose your target
              language.
            </p>
          </div>

        </div>

        <div className="translation-form">

          {/* DOCUMENT */}

          <div className="translation-field">
            <label>
              Select Document
            </label>

            <select
              value={documentId}
              onChange={(e) => {
                setDocumentId(
                  e.target.value
                );

                setTranslation(null);
                setMessage("");
                setError("");
              }}
            >
              <option value="">
                Choose a document
              </option>

              {documents.map((doc) => (
                <option
                  key={doc.id}
                  value={doc.id}
                >
                  #{doc.id} — {doc.filename}
                </option>
              ))}
            </select>
          </div>

          {/* LANGUAGE */}

          <div className="translation-field">
            <label>
              Target Language
            </label>

            <select
              value={language}
              onChange={(e) => {
                setLanguage(
                  e.target.value
                );

                setTranslation(null);
                setMessage("");
                setError("");
              }}
              disabled={loadingLanguages}
            >
              <option value="">
                {loadingLanguages
                  ? "Loading languages..."
                  : "Choose a language"}
              </option>

              {languages.map(
                (item, index) => {
                  const value =
                    getLanguageValue(item);

                  const name =
                    getLanguageName(item);

                  return (
                    <option
                      key={`${value}-${index}`}
                      value={value}
                    >
                      {name}
                    </option>
                  );
                }
              )}
            </select>
          </div>

          {/* TRANSLATE BUTTON */}

          <button
            type="button"
            className="translation-button"
            onClick={handleTranslate}
            disabled={
              loading ||
              loadingLanguages ||
              !documentId ||
              !language
            }
          >
            {loading
              ? "Translating..."
              : "🌐 Translate Document"}
          </button>

        </div>
      </div>

      {/* =====================================================
          TRANSLATION RESULT
      ===================================================== */}

      {translation && (
        <div className="translation-result-card">

          <div className="translation-result-header">

            <div>
              <p className="page-eyebrow">
                TRANSLATION RESULT
              </p>

              <h2>
                {getTranslationLanguage()}
              </h2>

              <p
                style={{
                  marginTop: "6px",
                  opacity: 0.75,
                }}
              >
                📄{" "}
                {translation.filename ||
                  getDocumentName(
                    translation.document_id ||
                      documentId
                  )}
              </p>
            </div>

            <span className="translation-status">
              ✓ Completed
            </span>

          </div>

          {/* ACTION BUTTONS */}

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                handleCopyTranslation()
              }
              style={{
                padding: "9px 15px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              📋 Copy
            </button>

            <button
              type="button"
              onClick={() =>
                handleDownloadTranslation()
              }
              style={{
                padding: "9px 15px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              📥 Download
            </button>
          </div>

          <div className="translation-result-text">

            {getTranslatedText() ? (
              <div
                className="translated-content"
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.8",
                }}
              >
                {getTranslatedText()}
              </div>
            ) : (
              <div>
                Translation completed
                successfully.
              </div>
            )}

          </div>

        </div>
      )}

      {/* =====================================================
          PREVIOUS TRANSLATIONS
      ===================================================== */}

      <div className="translation-card">

        <div className="translation-history-header">

          <div>
            <p className="page-eyebrow">
              SAVED TRANSLATIONS
            </p>

            <h2>
              Previous Translations
            </h2>

            <p
              style={{
                marginTop: "5px",
                opacity: 0.7,
              }}
            >
              View or download translations
              previously generated for this
              document.
            </p>
          </div>

          <span className="translation-count">
            {translations.length} saved
          </span>

        </div>

        {translations.length === 0 ? (

          <div className="translation-empty">

            <div className="translation-empty-icon">
              🌐
            </div>

            <h3>
              No translations yet
            </h3>

            <p>
              Your translated documents
              will appear here.
            </p>

          </div>

        ) : (

          <div className="translation-history">

            {translations.map(
              (item, index) => {

                const itemLanguage =
                  item?.target_language ||
                  item?.language ||
                  item?.targetLanguage ||
                  "Translation";

                const itemDocument =
                  item?.document_id ||
                  documentId;

                const itemText =
                  getTranslatedText(item);

                return (
                  <div
                    className="translation-history-item"
                    key={
                      item?.translation_id ||
                      item?.id ||
                      `${itemLanguage}-${itemDocument}-${index}`
                    }
                  >

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >

                      <strong>
                        {typeof itemLanguage ===
                        "string"
                          ? itemLanguage
                          : JSON.stringify(
                              itemLanguage
                            )}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "4px",
                        }}
                      >
                        📄 Document #
                        {itemDocument}
                      </span>

                      {item?.created_at && (
                        <span
                          style={{
                            display: "block",
                            marginTop: "3px",
                            opacity: 0.65,
                            fontSize: "12px",
                          }}
                        >
                          Saved:{" "}
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </span>
                      )}

                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >

                      <span className="translation-history-status">
                        ✓ Saved
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleViewTranslation(
                            item
                          )
                        }
                        disabled={!itemText}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "7px",
                          border: "1px solid #ccc",
                          cursor: itemText
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        👁️ View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadTranslation(
                            item
                          )
                        }
                        disabled={!itemText}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "7px",
                          border: "1px solid #ccc",
                          cursor: itemText
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        📥 Download
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          LEGAL NOTICE
      ===================================================== */}

      <div className="translation-note">

        <strong>
          ⚖️ Legal Information Notice
        </strong>

        <p>
          Translation is provided for
          legal information and document
          understanding. It does not replace
          advice from a qualified legal
          professional.
        </p>

      </div>

    </div>
  );
}

export default Translation;