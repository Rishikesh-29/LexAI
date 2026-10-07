import Translation from "./pages/Translation";
import VoiceAssistant from "./pages/VoiceAssistant";
import { useState } from "react";

import axios from "axios";

import "./index.css";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Analysis from "./pages/Analysis";
import CasePlan from "./pages/CasePlan";
import LawyerFinder from "./pages/LawyerFinder";

import AppShell from "./components/AppShell";

const API_URL = "http://127.0.0.1:8000";

function App() {
  // =========================================================
  // AUTHENTICATION STATE
  // =========================================================

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  // =========================================================
  // APPLICATION STATE
  // =========================================================

  const [activePage, setActivePage] = useState("dashboard");

  const [documentId, setDocumentId] = useState(null);

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      // -----------------------------------------------------
      // LOGIN
      // -----------------------------------------------------

      if (isLogin) {
        const response = await axios.post(
          `${API_URL}/auth/login`,
          {
            email: email,
            password: password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const token = response.data.access_token;

        localStorage.setItem("access_token", token);

        setIsLoggedIn(true);
        setActivePage("dashboard");
        setMessage("Login successful!");

        setPassword("");
      }

      // -----------------------------------------------------
      // REGISTER
      // -----------------------------------------------------

      else {
        const response = await axios.post(
          `${API_URL}/auth/register`,
          {
            name: name,
            email: email,
            password: password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "Registration response:",
          response.data
        );

        setMessage(
          "Registration successful! Please login."
        );

        setIsLogin(true);

        setName("");
        setPassword("");
      }
    } catch (error) {
      console.error("LexAI Error:", error);

      // -----------------------------------------------------
      // BACKEND RETURNED A RESPONSE
      // -----------------------------------------------------

      if (error.response) {
        console.error(
          "Backend response:",
          error.response.data
        );

        const detail =
          error.response.data?.detail;

        if (Array.isArray(detail)) {
          setMessage(
            detail
              .map((item) => item.msg)
              .join(", ")
          );
        } else {
          setMessage(
            detail || "Something went wrong."
          );
        }
      }

      // -----------------------------------------------------
      // REQUEST SENT BUT BACKEND DID NOT RESPOND
      // -----------------------------------------------------

      else if (error.request) {
        setMessage(
          "Cannot connect to LexAI backend."
        );
      }

      // -----------------------------------------------------
      // OTHER ERROR
      // -----------------------------------------------------

      else {
        setMessage(
          "An unexpected error occurred."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setIsLoggedIn(false);

    setActivePage("dashboard");

    setDocumentId(null);

    setEmail("");
    setPassword("");
    setName("");

    setMessage("");
  };

  // =========================================================
  // SIDEBAR NAVIGATION
  // =========================================================

  const handleNavigate = (page) => {
    console.log("Navigating to:", page);

    setActivePage(page);

    /*
      Do not remove the selected document when navigating
      between pages.

      This allows Analysis / Case Plans / Voice Assistant
      to continue using the current document.
    */
  };

  // =========================================================
  // OPEN DOCUMENT ANALYSIS
  // =========================================================

  const handleAnalyze = (id) => {
    console.log(
      "Opening analysis for document:",
      id
    );

    setDocumentId(id);

    setActivePage("analysis");
  };

  // =========================================================
  // BACK TO DASHBOARD
  // =========================================================

  const handleBackToDashboard = () => {
    setDocumentId(null);

    setActivePage("dashboard");
  };

  // =========================================================
  // PLACEHOLDER PAGE
  // =========================================================

  const PlaceholderPage = ({
    icon,
    title,
    description,
    buttonText,
    buttonAction,
  }) => {
    return (
      <div className="placeholder-page">

        <div className="placeholder-icon">
          {icon}
        </div>

        <h1>
          {title}
        </h1>

        <p>
          {description}
        </p>

        {buttonText && buttonAction && (
          <button onClick={buttonAction}>
            {buttonText}
          </button>
        )}

      </div>
    );
  };

  // =========================================================
  // LOGGED-IN CONTENT
  // =========================================================

  const renderLoggedInPage = () => {

    // -------------------------------------------------------
    // DASHBOARD
    // -------------------------------------------------------

    if (activePage === "dashboard") {
      return (
        <Dashboard
          onAnalyze={handleAnalyze}
          onNavigate={handleNavigate}
        />
      );
    }

    // -------------------------------------------------------
    // DOCUMENTS
    // -------------------------------------------------------

    if (activePage === "documents") {
      return (
        <Documents
          onAnalyze={handleAnalyze}
        />
      );
    }

    // -------------------------------------------------------
    // AI ANALYSIS
    // -------------------------------------------------------

    if (activePage === "analysis") {

      if (!documentId) {
        return (
          <PlaceholderPage
            icon="🤖"
            title="AI Legal Analysis"
            description="Enter a processed document ID from the Dashboard to view its AI-powered legal analysis."
            buttonText="Go to Dashboard"
            buttonAction={() =>
              handleNavigate("dashboard")
            }
          />
        );
      }

      return (
        <Analysis
          documentId={documentId}
        />
      );
    }

    // -------------------------------------------------------
    // TRANSLATION
    // -------------------------------------------------------

    if (activePage === "translation") {
      return (
        <Translation
          documentId={documentId}
        />
      );
    }

    // -------------------------------------------------------
    // CASE PLANS
    // -------------------------------------------------------

    if (activePage === "case-plan") {

      if (!documentId) {
        return (
          <PlaceholderPage
            icon="📋"
            title="Case Plans"
            description="Open an analyzed document first to generate and review its legal case plan."
            buttonText="Go to Dashboard"
            buttonAction={() =>
              handleNavigate("dashboard")
            }
          />
        );
      }

      return (
        <CasePlan
          documentId={documentId}
          onBack={() => handleNavigate("analysis")}
        />
      );
    }

    // -------------------------------------------------------
    // LAWYER FINDER
    // -------------------------------------------------------

    if (activePage === "lawyers") {
      return (
        <LawyerFinder />
      );
    }

    // -------------------------------------------------------
    // VOICE ASSISTANT
    // -------------------------------------------------------

    if (activePage === "voice") {

      return (
        <VoiceAssistant
          documentId={documentId}
        />
      );
    }

    // -------------------------------------------------------
    // SETTINGS
    // -------------------------------------------------------

    if (activePage === "settings") {
      return (
        <PlaceholderPage
          icon="⚙️"
          title="Settings"
          description="Manage your LexAI workspace preferences, account settings and application configuration."
          buttonText="Go to Dashboard"
          buttonAction={() =>
            handleNavigate("dashboard")
          }
        />
      );
    }

    // -------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------

    return (
      <Dashboard
        onAnalyze={handleAnalyze}
        onNavigate={handleNavigate}
      />
    );
  };

  // =========================================================
  // AUTHENTICATED APPLICATION
  // =========================================================

  if (isLoggedIn) {
    return (
      <AppShell
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {renderLoggedInPage()}
      </AppShell>
    );
  }

  // =========================================================
  // LOGIN / REGISTER PAGE
  // =========================================================

  return (
    <div className="app-container">

      <div className="auth-card">

        {/* LOGO */}

        <div className="logo">
          ⚖️
        </div>

        <h1>
          LexAI
        </h1>

        <p className="subtitle">
          AI Powered Legal Document Intelligence
        </p>

        {/* AUTH TABS */}

        <div className="tabs">

          <button
            type="button"
            className={
              isLogin
                ? "active"
                : ""
            }
            onClick={() => {
              setIsLogin(true);
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={
              !isLogin
                ? "active"
                : ""
            }
            onClick={() => {
              setIsLogin(false);
              setMessage("");
            }}
          >
            Register
          </button>

        </div>

        {/* AUTH FORM */}

        <form onSubmit={handleSubmit}>

          {/* NAME */}

          {!isLogin && (
            <div className="input-group">

              <label>
                Name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />

            </div>
          )}

          {/* EMAIL */}

          <div className="input-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          {/* PASSWORD */}

          <div className="input-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>

        </form>

        {/* MESSAGE */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* FOOTER */}

        <p className="footer-text">
          Secure • Intelligent • Accessible
        </p>

      </div>

    </div>
  );
}

export default App;