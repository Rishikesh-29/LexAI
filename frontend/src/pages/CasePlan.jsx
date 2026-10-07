import { useEffect, useMemo, useState } from "react";
import LawyerFinder from "./LawyerFinder";
import api from "../services/api";

function CasePlan({ documentId, onBack }) {
  const [showLawyers, setShowLawyers] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DOCUMENT ANALYSIS
  // =========================================================

  useEffect(() => {
    const fetchAnalysis = async () => {
      setAnalysis(null);
      setError("");

      if (!documentId) {
        setLoading(false);
        setError(
          "No document was selected. Please analyze a document first."
        );
        return;
      }

      try {
        setLoading(true);

        const response = await api.get(
          `/documents/${documentId}/analysis`
        );

        if (!response.data) {
          setError(
            "No analysis data was returned for this document."
          );
          return;
        }

        setAnalysis(response.data);
      } catch (err) {
        console.error(
          "Failed to load document analysis:",
          err
        );

        if (err.response?.status === 401) {
          setError(
            "Your session has expired. Please login again."
          );
        } else if (err.response?.status === 404) {
          setError(
            "No analysis was found for this document. Please analyze the document first."
          );
        } else {
          const detail = err.response?.data?.detail;

          if (Array.isArray(detail)) {
            setError(
              detail
                .map(
                  (item) =>
                    item.msg || "Validation error"
                )
                .join(", ")
            );
          } else {
            setError(
              detail ||
                "Failed to load document analysis."
            );
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [documentId]);

  // =========================================================
  // GENERATE CASE PLAN
  // =========================================================

  const plan = useMemo(() => {
    const risks = Array.isArray(analysis?.risks)
      ? analysis.risks
      : [];

    const obligations = Array.isArray(
      analysis?.obligations
    )
      ? analysis.obligations
      : [];

    const clauses = Array.isArray(
      analysis?.key_clauses
    )
      ? analysis.key_clauses
      : [];

    const steps = [];

    // STEP 1
    steps.push({
      number: 1,
      icon: "📄",
      title: "Understand the Document",
      description:
        "Review the document summary, parties, important clauses and overall purpose before taking action.",
    });

    // STEP 2
    if (obligations.length > 0) {
      steps.push({
        number: steps.length + 1,
        icon: "📋",
        title: "Review Your Obligations",
        description:
          "Check the obligations identified by LexAI and verify the deadlines, payments and responsibilities that apply to you.",
      });
    }

    // STEP 3
    if (clauses.length > 0) {
      steps.push({
        number: steps.length + 1,
        icon: "🔍",
        title: "Review Important Clauses",
        description:
          "Pay particular attention to payment, termination, confidentiality and service-related clauses.",
      });
    }

    // STEP 4
    if (risks.length > 0) {
      steps.push({
        number: steps.length + 1,
        icon: "⚠️",
        title: "Evaluate Potential Risks",
        description:
          `LexAI detected ${risks.length} potential risk area${
            risks.length === 1 ? "" : "s"
          }. Review these provisions carefully.`,
      });
    }

    // STEP 5
    steps.push({
      number: steps.length + 1,
      icon: "📁",
      title: "Collect Supporting Evidence",
      description:
        "Keep copies of agreements, invoices, receipts, emails, notices and other relevant communications.",
    });

    // STEP 6
    steps.push({
      number: steps.length + 1,
      icon: "⚖️",
      title: "Consult a Legal Professional",
      description:
        "For important legal decisions or significant risks, discuss the document with a qualified lawyer.",
    });

    // STEP 7
    steps.push({
      number: steps.length + 1,
      icon: "✅",
      title: "Recommended Next Step",
      description:
        risks.length > 0
          ? "Review the detected risk areas first and seek professional legal guidance before taking an important legal action."
          : "Review the document obligations and deadlines, then seek professional legal guidance if you are uncertain about your rights or responsibilities.",
    });

    return steps;
  }, [analysis]);

  // =========================================================
  // LAWYER FINDER
  // =========================================================

  if (showLawyers) {
    return (
      <LawyerFinder
        onBack={() => setShowLawyers(false)}
      />
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="case-plan-page">
        <div className="case-plan-header">
          <div>
            <span className="case-plan-label">
              📋 CASE APPLICATION PLAN
            </span>

            <h1>Generating Case Plan...</h1>

            <p>
              Loading AI analysis for Document ID{" "}
              {documentId}.
            </p>
          </div>

          <button
            className="case-plan-back"
            onClick={onBack}
          >
            ← Back to Analysis
          </button>
        </div>

        <div className="case-plan-summary">
          <div className="case-plan-summary-icon">
            🤖
          </div>

          <div>
            <h2>Loading Analysis</h2>

            <p>
              LexAI is retrieving the analyzed
              document information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="case-plan-page">
        <div className="case-plan-header">
          <div>
            <span className="case-plan-label">
              📋 CASE APPLICATION PLAN
            </span>

            <h1>Case Plan</h1>

            <p>
              Document ID {documentId}
            </p>
          </div>

          <button
            className="case-plan-back"
            onClick={onBack}
          >
            ← Back to Analysis
          </button>
        </div>

        <div className="case-plan-warning">
          <strong>
            ⚠️ Unable to Generate Case Plan
          </strong>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN CASE PLAN
  // =========================================================

  return (
    <div className="case-plan-page">

      {/* HEADER */}

      <div className="case-plan-header">
        <div>
          <span className="case-plan-label">
            📋 CASE APPLICATION PLAN
          </span>

          <h1>Recommended Action Plan</h1>

          <p>
            Practical next steps based on the analysis
            of Document ID {documentId}.
          </p>
        </div>

        <button
          className="case-plan-back"
          onClick={onBack}
        >
          ← Back to Analysis
        </button>
      </div>

      {/* SUMMARY */}

      <div className="case-plan-summary">
        <div className="case-plan-summary-icon">
          🤖
        </div>

        <div>
          <h2>LexAI Recommendation</h2>

          <p>
            This plan is generated from the detected
            clauses, obligations and potential risks
            in your document.
          </p>
        </div>
      </div>

      {/* ANALYSIS OVERVIEW */}

      <div className="case-plan-overview">

        <div className="case-plan-overview-card">
          <span className="case-plan-overview-icon">
            📋
          </span>

          <div>
            <strong>
              {Array.isArray(analysis?.key_clauses)
                ? analysis.key_clauses.length
                : 0}
            </strong>

            <span>Key Clauses</span>
          </div>
        </div>

        <div className="case-plan-overview-card">
          <span className="case-plan-overview-icon">
            ⚠️
          </span>

          <div>
            <strong>
              {Array.isArray(analysis?.risks)
                ? analysis.risks.length
                : 0}
            </strong>

            <span>Risk Areas</span>
          </div>
        </div>

        <div className="case-plan-overview-card">
          <span className="case-plan-overview-icon">
            📋
          </span>

          <div>
            <strong>
              {Array.isArray(analysis?.obligations)
                ? analysis.obligations.length
                : 0}
            </strong>

            <span>Obligations</span>
          </div>
        </div>

      </div>

      {/* TIMELINE */}

      <div className="case-plan-timeline">
        {plan.map((step) => (
          <div
            className="case-plan-step"
            key={step.number}
          >
            <div className="case-plan-number">
              {step.number}
            </div>

            <div className="case-plan-line"></div>

            <div className="case-plan-step-card">
              <div className="case-plan-icon">
                {step.icon}
              </div>

              <div>
                <h2>{step.title}</h2>

                <p>
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LAWYER SECTION */}

      <div className="case-plan-lawyer-section">
        <div className="case-plan-lawyer-icon">
          ⚖️
        </div>

        <div className="case-plan-lawyer-content">
          <h2>
            Need Professional Legal Assistance?
          </h2>

          <p>
            Connect with a legal professional based
            on your location and legal requirements.
          </p>

          <button
            className="find-lawyer-button"
            onClick={() => setShowLawyers(true)}
          >
            ⚖️ Find a Lawyer
          </button>
        </div>
      </div>

      {/* DISCLAIMER */}

      <div className="case-plan-warning">
        <strong>⚠️ Important</strong>

        <p>
          This action plan is generated by LexAI for
          document understanding and educational
          purposes. It is not legal advice and does
          not replace consultation with a qualified
          legal professional.
        </p>
      </div>

    </div>
  );
}

export default CasePlan;