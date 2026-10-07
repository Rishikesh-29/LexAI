import React from "react";

function Topbar({ activePage, onLogout }) {
  const pageTitles = {
    dashboard: "Dashboard",
    documents: "Documents",
    analysis: "AI Analysis",
    translation: "Translation",
    "case-plan": "Case Plans",
    lawyers: "Find a Lawyer",
    voice: "Voice Assistant",
    settings: "Settings",
  };

  const pageTitle =
    pageTitles[activePage] || "Dashboard";

  return (
    <header className="lexai-topbar">

      {/* Left Side */}
      <div className="topbar-left">
        <div>
          <p className="topbar-breadcrumb">
            LexAI / {pageTitle}
          </p>

          <h1>{pageTitle}</h1>
        </div>
      </div>

      {/* Right Side */}
      <div className="topbar-right">

        {/* Search */}
        <div className="topbar-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search..."
          />
        </div>

        {/* Notifications */}
        <button
          className="topbar-icon-button"
          title="Notifications"
        >
          🔔
          <span className="notification-dot"></span>
        </button>

        {/* User Profile */}
        <div className="topbar-profile">

          <div className="topbar-avatar">
            R
          </div>

          <div className="topbar-user-info">
            <strong>LexAI User</strong>
            <span>Legal Workspace</span>
          </div>

          <span className="profile-arrow">
            ▾
          </span>

        </div>

      </div>

    </header>
  );
}

export default Topbar;