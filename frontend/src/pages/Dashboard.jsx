import { useState } from "react";

function Dashboard({ onAnalyze, onNavigate }) {
  const [documentId, setDocumentId] = useState("");
  const [error, setError] = useState("");

  const stats = [
    {
      title: "Legal Documents",
      value: "6",
      icon: "📄",
      description: "Uploaded documents",
    },
    {
      title: "Documents Analyzed",
      value: "1",
      icon: "🤖",
      description: "AI analysis completed",
    },
    {
      title: "Translations",
      value: "2",
      icon: "🌐",
      description: "Language translations",
    },
    {
      title: "Case Plans",
      value: "0",
      icon: "📋",
      description: "Generated case plans",
    },
  ];

  const handleAnalyze = (e) => {
    e.preventDefault();

    setError("");

    const id = documentId.trim();

    if (!id) {
      setError("Please enter a document ID.");
      return;
    }

    if (!onAnalyze) {
      setError("Analysis navigation is not connected.");
      console.error("onAnalyze function is missing.");
      return;
    }

    console.log("Opening analysis for document:", id);

    onAnalyze(id);
  };

  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div className="dashboard-page">

      {/* =====================================================
          WELCOME SECTION
      ===================================================== */}

      <section className="dashboard-welcome">

        <div>
          <p className="dashboard-eyebrow">
            LEGAL INTELLIGENCE WORKSPACE
          </p>

          <h1>
            Welcome back 👋
          </h1>

          <p className="dashboard-description">
            Manage your legal documents, analyze important information,
            translate documents and organize your case intelligence.
          </p>
        </div>

        <div className="dashboard-welcome-badge">
          <span>⚖️</span>
          <div>
            <strong>LexAI</strong>
            <small>AI Legal Assistant</small>
          </div>
        </div>

      </section>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="dashboard-stats">

        {stats.map((item) => (
          <div
            className="dashboard-stat-card"
            key={item.title}
          >

            <div className="dashboard-stat-top">

              <div className="dashboard-stat-icon">
                {item.icon}
              </div>

              <span className="dashboard-stat-arrow">
                ↗
              </span>

            </div>

            <div className="dashboard-stat-value">
              {item.value}
            </div>

            <div className="dashboard-stat-title">
              {item.title}
            </div>

            <div className="dashboard-stat-description">
              {item.description}
            </div>

          </div>
        ))}

      </section>


      {/* =====================================================
          AI ANALYSIS LAUNCH
      ===================================================== */}

      <section className="dashboard-analysis-card">

        <div className="dashboard-analysis-content">

          <div className="dashboard-analysis-icon">
            🤖
          </div>

          <div>
            <span className="dashboard-card-label">
              AI-POWERED ANALYSIS
            </span>

            <h2>
              Analyze a Legal Document
            </h2>

            <p>
              Enter a processed document ID to view its AI-powered
              summary, key clauses, rights, obligations, risks,
              parties, dates and relevant laws.
            </p>
          </div>

        </div>


        <form
          className="dashboard-analysis-form"
          onSubmit={handleAnalyze}
        >

          <div className="dashboard-document-input">

            <span>📄</span>

            <input
              type="number"
              min="1"
              placeholder="Enter Document ID"
              value={documentId}
              onChange={(e) => {
                setDocumentId(e.target.value);
                setError("");
              }}
            />

          </div>

          <button type="submit">
            View Analysis
            <span>→</span>
          </button>

        </form>

        {error && (
          <div className="dashboard-error">
            ⚠️ {error}
          </div>
        )}

      </section>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="dashboard-section">

        <div className="dashboard-section-header">

          <div>
            <span className="dashboard-card-label">
              WORKSPACE
            </span>

            <h2>
              Quick Actions
            </h2>
          </div>

          <p>
            Access your most-used LexAI tools
          </p>

        </div>


        <div className="dashboard-actions-grid">

          {/* Documents */}

          <button
            className="dashboard-action-card"
            onClick={() => handleNavigation("documents")}
          >

            <div className="dashboard-action-icon">
              📤
            </div>

            <div className="dashboard-action-content">

              <h3>
                Upload Document
              </h3>

              <p>
                Upload PDF, DOCX or TXT legal documents
                for intelligent processing.
              </p>

            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </button>


          {/* AI Analysis */}

          <button
            className="dashboard-action-card"
            onClick={() => handleNavigation("analysis")}
          >

            <div className="dashboard-action-icon">
              🤖
            </div>

            <div className="dashboard-action-content">

              <h3>
                AI Analysis
              </h3>

              <p>
                Extract summaries, clauses, risks,
                rights and relevant laws.
              </p>

            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </button>


          {/* Translation */}

          <button
            className="dashboard-action-card"
            onClick={() => handleNavigation("translation")}
          >

            <div className="dashboard-action-icon">
              🌐
            </div>

            <div className="dashboard-action-content">

              <h3>
                Translate
              </h3>

              <p>
                Translate legal documents into
                supported Indian languages.
              </p>

            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </button>


          {/* Lawyer */}

          <button
            className="dashboard-action-card"
            onClick={() => handleNavigation("lawyers")}
          >

            <div className="dashboard-action-icon">
              ⚖️
            </div>

            <div className="dashboard-action-content">

              <h3>
                Find a Lawyer
              </h3>

              <p>
                Find legal professionals based on
                specialization and location.
              </p>

            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </button>

        </div>

      </section>


      {/* =====================================================
          PLATFORM CAPABILITIES
      ===================================================== */}

      <section className="dashboard-bottom-grid">

        <div className="dashboard-info-card">

          <div className="dashboard-info-icon">
            🔐
          </div>

          <div>
            <h3>
              Secure Legal Workspace
            </h3>

            <p>
              Your authenticated workspace keeps document
              management and analysis organized in one place.
            </p>
          </div>

          <span className="dashboard-info-status">
            ● Protected
          </span>

        </div>


        <div className="dashboard-info-card">

          <div className="dashboard-info-icon">
            🧠
          </div>

          <div>
            <h3>
              Intelligent Legal Insights
            </h3>

            <p>
              LexAI converts complex legal documents into
              structured and understandable information.
            </p>
          </div>

          <span className="dashboard-info-status">
            ● AI Ready
          </span>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;