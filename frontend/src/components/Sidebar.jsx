import React from "react";

function Sidebar({ activePage, onNavigate, onLogout }) {
  const menuItems = [
    {
      id: "dashboard",
      icon: "🏠",
      label: "Dashboard",
    },
    {
      id: "documents",
      icon: "📄",
      label: "Documents",
    },
    {
      id: "analysis",
      icon: "🤖",
      label: "AI Analysis",
    },
    {
      id: "translation",
      icon: "🌐",
      label: "Translation",
    },
    {
      id: "case-plan",
      icon: "📋",
      label: "Case Plans",
    },
    {
      id: "lawyers",
      icon: "⚖️",
      label: "Find a Lawyer",
    },
    {
      id: "voice",
      icon: "🎙️",
      label: "Voice Assistant",
    },
  ];

  return (
    <aside className="lexai-sidebar">

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          ⚖️
        </div>

        <div className="brand-text">
          <h2>LexAI</h2>
          <span>Legal Intelligence</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="sidebar-section">
        <p className="sidebar-section-title">
          MAIN MENU
        </p>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${
                activePage === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="sidebar-nav-icon">
                {item.icon}
              </span>

              <span className="sidebar-nav-label">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="sidebar-bottom">

        <button
          className={`sidebar-nav-item ${
            activePage === "settings"
              ? "active"
              : ""
          }`}
          onClick={() => onNavigate("settings")}
        >
          <span className="sidebar-nav-icon">
            ⚙️
          </span>

          <span className="sidebar-nav-label">
            Settings
          </span>
        </button>

        <button
          className="sidebar-nav-item logout-item"
          onClick={onLogout}
        >
          <span className="sidebar-nav-icon">
            🚪
          </span>

          <span className="sidebar-nav-label">
            Logout
          </span>
        </button>

      </div>
    </aside>
  );
}

export default Sidebar;