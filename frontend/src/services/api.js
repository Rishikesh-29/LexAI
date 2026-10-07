import axios from "axios";

// =========================================================
// API BASE URL
// =========================================================
// Local development:
// http://127.0.0.1:8000
//
// Production:
// Set VITE_API_BASE_URL in .env.production
// =========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// =========================================================
// AUTOMATICALLY ATTACH JWT TOKEN
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================
// LEGAL REPORT DOWNLOAD
// =========================================================

export const downloadLegalReport = async (documentId) => {
  const response = await api.get(`/reports/${documentId}/pdf`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/pdf",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `LexAI_Report_Document_${documentId}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

// =========================================================
// ASK LEXAI - DOCUMENT QUESTION & ANSWER
// =========================================================

export const askDocumentQuestion = async (documentId, question) => {
  const response = await api.post(`/documents/${documentId}/ask`, {
    question,
  });

  return response.data;
};

// =========================================================
// DEFAULT API
// =========================================================

export default api;