import { useEffect, useState } from "react";
import api from "../services/api";

function Documents({ onAnalyze }) {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DOCUMENTS
  // =========================================================

  const loadDocuments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/documents/");

      console.log("Documents response:", response.data);

      if (Array.isArray(response.data)) {
        setDocuments(response.data);
      } else if (Array.isArray(response.data?.documents)) {
        setDocuments(response.data.documents);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response?.data?.detail ||
          "Unable to load documents."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD ON PAGE OPEN
  // =========================================================

  useEffect(() => {
    loadDocuments();
  }, []);

  // =========================================================
  // FILE SELECTION
  // =========================================================

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    setMessage("");
    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".docx",
      ".txt",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowed = allowedExtensions.some(
      (extension) => fileName.endsWith(extension)
    );

    if (!isAllowed) {
      setSelectedFile(null);
      setError(
        "Only PDF, DOCX and TXT files are supported."
      );
      return;
    }

    setSelectedFile(file);
  };

  // =========================================================
  // UPLOAD DOCUMENT
  // =========================================================

  const handleUpload = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!selectedFile) {
      setError("Please select a PDF, DOCX or TXT file.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await api.post(
        "/documents/upload",
        formData
      );

      console.log(
        "Upload response:",
        response.data
      );

      setMessage(
        `Document uploaded successfully${
          response.data?.id
            ? ` — Document ID: ${response.data.id}`
            : ""
        }`
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "lexai-document-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();
    } catch (err) {
      console.error(
        "Document upload failed:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        const detail =
          err.response?.data?.detail;

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) => item.msg)
              .join(", ")
          );
        } else {
          setError(
            detail ||
            "Document upload failed."
          );
        }
      }
    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // ANALYZE DOCUMENT
  // =========================================================

  const handleAnalyzeDocument = (id) => {
    if (!onAnalyze) {
      console.error(
        "onAnalyze function is missing."
      );
      return;
    }

    console.log(
      "Opening document analysis:",
      id
    );

    onAnalyze(id);
  };

  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const getStatusClass = (status) => {
    const value =
      String(status || "")
        .toLowerCase();

    if (
      value.includes("analy") ||
      value.includes("process") ||
      value.includes("complete")
    ) {
      return "document-status-success";
    }

    if (
      value.includes("fail") ||
      value.includes("error")
    ) {
      return "document-status-error";
    }

    if (
      value.includes("pending") ||
      value.includes("upload")
    ) {
      return "document-status-pending";
    }

    return "document-status-default";
  };

  // =========================================================
  // DOCUMENT TYPE
  // =========================================================

  const getDocumentType = (document) => {
    const filename =
      document.filename ||
      document.file_name ||
      document.name ||
      "";

    const extension =
      filename
        .split(".")
        .pop()
        ?.toUpperCase();

    return extension || "FILE";
  };

  // =========================================================
  // DOCUMENT ICON
  // =========================================================

  const getDocumentIcon = (document) => {
    const type =
      getDocumentType(document);

    if (type === "PDF") {
      return "📕";
    }

    if (type === "DOCX") {
      return "📘";
    }

    if (type === "TXT") {
      return "📄";
    }

    return "📁";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="documents-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="documents-heading">

        <div>
          <span className="documents-eyebrow">
            DOCUMENT MANAGEMENT
          </span>

          <h1>
            Legal Documents
          </h1>

          <p>
            Upload, manage and analyze your legal
            documents securely with LexAI.
          </p>
        </div>

        <button
          className="documents-refresh-button"
          onClick={loadDocuments}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </section>


      {/* =====================================================
          UPLOAD
      ===================================================== */}

      <section className="document-upload-card">

        <div className="document-upload-icon">
          📤
        </div>

        <div className="document-upload-content">

          <span className="documents-card-label">
            ADD DOCUMENT
          </span>

          <h2>
            Upload a Legal Document
          </h2>

          <p>
            Upload PDF, DOCX or TXT files for
            text extraction and AI-powered legal analysis.
          </p>

          <form
            className="document-upload-form"
            onSubmit={handleUpload}
          >

            <label
              className="document-file-input"
              htmlFor="lexai-document-file"
            >
              <span>📎</span>

              <span className="document-file-name">
                {selectedFile
                  ? selectedFile.name
                  : "Choose a document"}
              </span>

              <span className="document-browse">
                Browse
              </span>
            </label>

            <input
              id="lexai-document-file"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              hidden
            />

            <button
              type="submit"
              className="document-upload-button"
              disabled={
                uploading ||
                !selectedFile
              }
            >
              {uploading
                ? "Uploading..."
                : "Upload Document"}
            </button>

          </form>

          <small className="document-supported">
            Supported formats: PDF, DOCX, TXT
          </small>

        </div>

      </section>


      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {message && (
        <div className="document-success-message">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="document-error-message">
          ⚠️ {error}
        </div>
      )}


      {/* =====================================================
          DOCUMENT LIST
      ===================================================== */}

      <section className="documents-list-section">

        <div className="documents-list-header">

          <div>
            <span className="documents-card-label">
              YOUR WORKSPACE
            </span>

            <h2>
              Recent Documents
            </h2>
          </div>

          <span className="documents-count">
            {documents.length} document
            {documents.length !== 1
              ? "s"
              : ""}
          </span>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="documents-empty-state">
            <div className="documents-loading-icon">
              ⏳
            </div>

            <h3>
              Loading documents...
            </h3>

            <p>
              Fetching your legal documents.
            </p>
          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          documents.length === 0 && (
            <div className="documents-empty-state">

              <div className="documents-empty-icon">
                📂
              </div>

              <h3>
                No documents yet
              </h3>

              <p>
                Upload your first legal document
                to start using LexAI.
              </p>

            </div>
          )}


        {/* DOCUMENTS */}

        {!loading &&
          documents.length > 0 && (
            <div className="documents-table-wrapper">

              <table className="documents-table">

                <thead>
                  <tr>
                    <th>Document</th>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {documents.map((document) => {

                    const id =
                      document.id;

                    const filename =
                      document.filename ||
                      document.file_name ||
                      document.name ||
                      `Document ${id}`;

                    const status =
                      document.status ||
                      "Uploaded";

                    return (
                      <tr key={id}>

                        <td>
                          <div className="document-name-cell">

                            <div className="document-row-icon">
                              {getDocumentIcon(
                                document
                              )}
                            </div>

                            <div>
                              <strong>
                                {filename}
                              </strong>

                              <span>
                                Legal document
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="document-id">
                            #{id}
                          </span>
                        </td>

                        <td>
                          <span className="document-type">
                            {getDocumentType(
                              document
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`document-status ${getStatusClass(
                              status
                            )}`}
                          >
                            ● {status}
                          </span>
                        </td>

                        <td>

                          <button
                            className="document-analyze-button"
                            onClick={() =>
                              handleAnalyzeDocument(
                                id
                              )
                            }
                          >
                            AI Analysis →
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

      </section>

    </div>
  );
}

export default Documents;