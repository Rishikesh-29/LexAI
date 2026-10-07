import { useEffect, useState } from "react";
import api, {
  downloadLegalReport,
  askDocumentQuestion,
} from "../services/api";
import CasePlan from "./CasePlan";

function Analysis({ documentId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCasePlan, setShowCasePlan] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // =========================================================
  // ASK LEXAI STATES
  // =========================================================

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sourceContext, setSourceContext] = useState([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");

  // =========================================================
  // FETCH ANALYSIS
  // =========================================================

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/documents/${documentId}/analysis`
        );

        setAnalysis(response.data);
      } catch (err) {
        console.error("Analysis fetch error:", err);

        if (err.response?.status === 401) {
          setError(
            "Invalid or expired token. Please login again."
          );
        } else if (err.response?.status === 404) {
          setError(
            "Analysis not found for this document."
          );
        } else if (err.response?.data?.detail) {
          setError(
            typeof err.response.data.detail === "string"
              ? err.response.data.detail
              : "Failed to fetch analysis."
          );
        } else {
          setError(
            "Cannot connect to LexAI backend."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchAnalysis();
    }
  }, [documentId]);

  // =========================================================
  // ASK LEXAI
  // =========================================================

  const handleAskQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setAskError("Please enter a question.");
      setAnswer("");
      setSourceContext([]);
      return;
    }

    try {
      setAskLoading(true);
      setAskError("");
      setAnswer("");
      setSourceContext([]);

      const result = await askDocumentQuestion(
        documentId,
        trimmedQuestion
      );

      setAnswer(result.answer || "");
      setSourceContext(
        Array.isArray(result.source_context)
          ? result.source_context
          : []
      );
    } catch (err) {
      console.error(
        "Ask LexAI error:",
        err
      );

      if (err.response?.status === 401) {
        setAskError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 404) {
        setAskError(
          "Document not found."
        );
      } else if (err.response?.status === 400) {
        setAskError(
          err.response?.data?.detail ||
            "Unable to process the question."
        );
      } else if (err.response?.data?.detail) {
        setAskError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Failed to answer the question."
        );
      } else {
        setAskError(
          "Cannot connect to LexAI backend."
        );
      }
    } finally {
      setAskLoading(false);
    }
  };

  // Allow Enter to ask the question
  const handleQuestionKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleAskQuestion();
    }
  };

  // =========================================================
  // DOWNLOAD LEGAL REPORT
  // =========================================================

  const handleDownloadReport = async () => {
    try {
      setReportLoading(true);

      await downloadLegalReport(documentId);
    } catch (err) {
      console.error(
        "Report download error:",
        err
      );

      if (err.response?.status === 401) {
        alert(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 404) {
        alert(
          "Legal report is not available. Please analyze the document first."
        );
      } else {
        alert(
          "Unable to download the legal report. Please try again."
        );
      }
    } finally {
      setReportLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="analysis-page">
        <div className="loading-card">
          <div className="loading-spinner"></div>

          <h2>
            Analyzing Legal Document...
          </h2>

          <p>
            LexAI is preparing your legal intelligence report.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="analysis-page">
        <div className="error-card">
          <h2>
            ⚠️ Unable to Load Analysis
          </h2>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // NO DATA
  // =========================================================

  if (!analysis) {
    return (
      <div className="analysis-page">
        <div className="error-card">
          <h2>
            No Analysis Available
          </h2>

          <p>
            There is no analysis data available for this
            document.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RISK SCORE
  // =========================================================

  function calculateRiskScore(risks) {
    if (
      !Array.isArray(risks) ||
      risks.length === 0
    ) {
      return {
        score: 10,
        level: "LOW RISK",
        levelClass: "low",
        count: 0,
        items: [],
      };
    }

    let score = 10;

    risks.forEach((risk) => {
      const riskName = String(
        risk?.risk || ""
      ).toLowerCase();

      if (riskName.includes("payment")) {
        score += 20;
      } else if (
        riskName.includes("termination")
      ) {
        score += 18;
      } else if (
        riskName.includes("confidentiality")
      ) {
        score += 16;
      } else if (
        riskName.includes("deadline")
      ) {
        score += 12;
      } else {
        score += 10;
      }
    });

    score = Math.min(score, 100);

    let level;
    let levelClass;

    if (score <= 35) {
      level = "LOW RISK";
      levelClass = "low";
    } else if (score <= 65) {
      level = "MEDIUM RISK";
      levelClass = "medium";
    } else {
      level = "HIGH RISK";
      levelClass = "high";
    }

    return {
      score,
      level,
      levelClass,
      count: risks.length,
      items: risks,
    };
  }

  const riskAssessment =
    calculateRiskScore(analysis.risks);

  // =========================================================
  // FORMAT OBJECT VALUES
  // =========================================================

  function formatValue(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (typeof value === "object") {
      return Object.entries(value)
        .map(([key, val]) => {
          if (typeof val === "object") {
            return `${formatKey(key)}: ${JSON.stringify(val)}`;
          }

          return `${formatKey(key)}: ${val}`;
        })
        .join(" • ");
    }

    return String(value);
  }

  function formatKey(key) {
    return String(key)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  // =========================================================
  // SAFE LIST RENDERER
  // =========================================================

  function renderList(items) {
    if (!items) {
      return (
        <p className="empty-text">
          No information available.
        </p>
      );
    }

    if (!Array.isArray(items)) {
      return (
        <div className="analysis-object">
          {Object.entries(items).map(
            ([key, value]) => (
              <div
                className="analysis-object-row"
                key={key}
              >
                <strong>
                  {formatKey(key)}:
                </strong>

                <span>
                  {formatValue(value)}
                </span>
              </div>
            )
          )}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <p className="empty-text">
          No information available.
        </p>
      );
    }

    return (
      <ul className="analysis-list">
        {items.map((item, index) => (
          <li key={index}>
            {typeof item === "object" ? (
              <div className="analysis-object">
                {Object.entries(item).map(
                  ([key, value]) => (
                    <div
                      className="analysis-object-row"
                      key={key}
                    >
                      <strong>
                        {formatKey(key)}:
                      </strong>

                      <span>
                        {formatValue(value)}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }

  // =========================================================
  // CASE PLAN SCREEN
  // =========================================================

  if (showCasePlan) {
    return (
      <CasePlan
        analysis={analysis}
        documentId={documentId}
        onBack={() =>
          setShowCasePlan(false)
        }
      />
    );
  }

  // =========================================================
  // MAIN ANALYSIS PAGE
  // =========================================================

  return (
    <div className="analysis-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="analysis-header">

        <div>
          <span className="analysis-label">
            ⚖️ LEXAI INTELLIGENCE
          </span>

          <h1>
            Legal Analysis Dashboard
          </h1>

          <p>
            AI-powered analysis of your legal document
          </p>
        </div>

        <div className="analysis-header-actions">

          <div className="document-badge">
            Document ID: {documentId}
          </div>

          <button
            className="case-plan-button"
            onClick={() =>
              setShowCasePlan(true)
            }
          >
            📋 Case Application Plan
          </button>

          <button
            className="case-plan-button"
            onClick={handleDownloadReport}
            disabled={reportLoading}
          >
            {reportLoading
              ? "⏳ Generating Report..."
              : "📄 Download Legal Report"}
          </button>

        </div>

      </div>

      {/* =====================================================
          ASK LEXAI
      ===================================================== */}

      <div className="analysis-card ask-lexai-card">

        <div className="card-header">
          <span className="card-icon">
            💬
          </span>

          <div>
            <h2>
              Ask LexAI
            </h2>

            <p className="ask-lexai-subtitle">
              Ask questions about this legal document
            </p>
          </div>
        </div>

        <div className="ask-lexai-content">

          <textarea
            className="ask-lexai-input"
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            onKeyDown={handleQuestionKeyDown}
            placeholder="Example: Who are the parties mentioned in this document?"
            rows={3}
            disabled={askLoading}
          />

          <div className="ask-lexai-actions">

            <span className="ask-lexai-hint">
              Press Enter to ask
            </span>

            <button
              className="ask-lexai-button"
              onClick={handleAskQuestion}
              disabled={
                askLoading ||
                !question.trim()
              }
            >
              {askLoading
                ? "⏳ Thinking..."
                : "🤖 Ask LexAI"}
            </button>

          </div>

          {askError && (
            <div className="ask-lexai-error">
              ⚠️ {askError}
            </div>
          )}

          {answer && (
            <div className="ask-lexai-answer">

              <div className="ask-lexai-answer-header">
                <span>
                  🤖
                </span>

                <strong>
                  LexAI Answer
                </strong>
              </div>

              <div className="ask-lexai-answer-text">
                {answer}
              </div>

              {sourceContext.length > 0 && (
                <div className="ask-lexai-source">

                  <strong>
                    📌 Source from document
                  </strong>

                  {sourceContext.map(
                    (source, index) => (
                      <p key={index}>
                        {source}
                      </p>
                    )
                  )}

                </div>
              )}

              <div className="ask-lexai-disclaimer">
                <strong>
                  ⚖️ Source:
                </strong>{" "}
                Uploaded document. LexAI provides
                AI-assisted information for
                informational purposes only and
                does not constitute legal advice.
              </div>

            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          RISK ASSESSMENT
      ===================================================== */}

      <div className="risk-assessment-card">

        <div className="risk-assessment-header">

          <div>
            <h2>
              🛡️ Overall Risk Assessment
            </h2>

            <p>
              Rule-based assessment from detected
              legal risk areas
            </p>
          </div>

          <div
            className={`risk-level-badge ${riskAssessment.levelClass}`}
          >
            {riskAssessment.level}
          </div>

        </div>

        <div className="risk-assessment-content">

          <div className="risk-score-circle">

            <span className="risk-score-number">
              {riskAssessment.score}
            </span>

            <span className="risk-score-label">
              / 100
            </span>

          </div>

          <div className="risk-details">

            <h3>
              {riskAssessment.count} Risk Area
              {riskAssessment.count !== 1
                ? "s"
                : ""}{" "}
              Detected
            </h3>

            <div className="risk-progress">

              <div
                className={`risk-progress-bar ${riskAssessment.levelClass}`}
                style={{
                  width: `${riskAssessment.score}%`,
                }}
              ></div>

            </div>

            {riskAssessment.items.length > 0 && (
              <div className="risk-items">

                {riskAssessment.items.map(
                  (risk, index) => (

                    <div
                      className="risk-item"
                      key={index}
                    >
                      <span>
                        ⚠️
                      </span>

                      <span>
                        {typeof risk === "object"
                          ? formatValue(risk)
                          : String(risk)}
                      </span>
                    </div>

                  )
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN ANALYSIS GRID
      ===================================================== */}

      <div className="analysis-grid">

        {/* SUMMARY */}

        <div className="analysis-card summary-card">

          <div className="card-header">
            <span className="card-icon">
              📝
            </span>

            <h2>
              Summary
            </h2>
          </div>

          <p>
            {analysis.summary ||
              "No summary available."}
          </p>

        </div>

        {/* KEY CLAUSES */}

        <div className="analysis-card">

          <div className="card-header">
            <span className="card-icon">
              📌
            </span>

            <h2>
              Key Clauses
            </h2>
          </div>

          {renderList(
            analysis.key_clauses
          )}

        </div>

        {/* RIGHTS */}

        <div className="analysis-card">

          <div className="card-header">
            <span className="card-icon">
              ⚖️
            </span>

            <h2>
              Rights
            </h2>
          </div>

          {renderList(
            analysis.rights
          )}

        </div>

        {/* OBLIGATIONS */}

        <div className="analysis-card">

          <div className="card-header">
            <span className="card-icon">
              📋
            </span>

            <h2>
              Obligations
            </h2>
          </div>

          {renderList(
            analysis.obligations
          )}

        </div>

        {/* RISKS */}

        <div className="analysis-card risk-card">

          <div className="card-header">
            <span className="card-icon">
              ⚠️
            </span>

            <h2>
              Potential Risks
            </h2>
          </div>

          {renderList(
            analysis.risks
          )}

        </div>

        {/* RELEVANT LAWS */}

        <div className="analysis-card">

          <div className="card-header">
            <span className="card-icon">
              📚
            </span>

            <h2>
              Relevant Laws
            </h2>
          </div>

          {renderList(
            analysis.relevant_laws
          )}

        </div>

        {/* IMPORTANT DATES */}

        <div className="analysis-card">

          <div className="card-header">
            <span className="card-icon">
              📅
            </span>

            <h2>
              Important Dates
            </h2>
          </div>

          {renderList(
            analysis.important_dates
          )}

        </div>

        {/* PARTIES */}

        <div className="analysis-card">

          <div className="card-header">
            <span className="card-icon">
              👥
            </span>

            <h2>
              Parties
            </h2>
          </div>

          {renderList(
            analysis.parties
          )}

        </div>

      </div>

      {/* =====================================================
          DISCLAIMER
      ===================================================== */}

      <div className="disclaimer">

        <strong>
          ⚠️ Legal Disclaimer
        </strong>

        <p>
          {analysis.disclaimer ||
            "LexAI provides AI-assisted document analysis for informational and educational purposes only. It does not constitute legal advice."}
        </p>

      </div>

    </div>
  );
}

export default Analysis;