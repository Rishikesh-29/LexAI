import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppShell({
  activePage,
  onNavigate,
  onLogout,
  children,
}) {
  return (
    <div className="lexai-app">

      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="lexai-main">

        <Topbar
          activePage={activePage}
          onLogout={onLogout}
        />

        <main className="lexai-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default AppShell;