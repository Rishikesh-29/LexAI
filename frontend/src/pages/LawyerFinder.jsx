import { useEffect, useState } from "react";
import api from "../services/api";

function LawyerFinder({ onBack }) {
  const [lawyers, setLawyers] = useState([]);
  const [city, setCity] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/lawyers/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.lawyers || [];

      setLawyers(data);
    } catch (err) {
      console.error("Lawyer fetch error:", err);

      if (err.response?.status === 401) {
        setError("Invalid or expired token. Please login again.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load lawyers."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const searchLawyers = async (e) => {
    e.preventDefault();

    try {
      setSearching(true);
      setError("");

      const params = {};

      if (city.trim()) {
        params.city = city.trim();
      }

      if (specialization.trim()) {
        params.specialization =
          specialization.trim();
      }

      params.available_only = availableOnly;

      const response = await api.get(
        "/lawyers/search",
        { params }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.lawyers || [];

      setLawyers(data);
    } catch (err) {
      console.error("Lawyer search error:", err);

      if (err.response?.status === 401) {
        setError("Invalid or expired token. Please login again.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to search lawyers."
        );
      }
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  const clearSearch = () => {
    setCity("");
    setSpecialization("");
    setAvailableOnly(true);
    fetchLawyers();
  };

  return (
    <div className="lawyer-page">

      {/* HEADER */}

      <div className="lawyer-header">

        <div>
          <span className="lawyer-label">
            ⚖️ LEGAL ASSISTANCE
          </span>

          <h1>
            Find a Lawyer
          </h1>

          <p>
            Find legal professionals based on
            location and specialization.
          </p>
        </div>

        <button
          className="lawyer-back-button"
          onClick={onBack}
        >
          ← Back
        </button>

      </div>

      {/* SEARCH */}

      <div className="lawyer-search-card">

        <h2>
          🔎 Search Legal Professionals
        </h2>

        <form
          className="lawyer-search-form"
          onSubmit={searchLawyers}
        >

          <div className="lawyer-input-group">

            <label>
              City
            </label>

            <input
              type="text"
              placeholder="e.g. Chennai"
              value={city}
              onChange={(e) =>
                setCity(e.target.value)
              }
            />

          </div>

          <div className="lawyer-input-group">

            <label>
              Specialization
            </label>

            <input
              type="text"
              placeholder="e.g. Criminal Law"
              value={specialization}
              onChange={(e) =>
                setSpecialization(
                  e.target.value
                )
              }
            />

          </div>

          <div className="lawyer-checkbox">

            <label>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) =>
                  setAvailableOnly(
                    e.target.checked
                  )
                }
              />

              <span>
                Available lawyers only
              </span>
            </label>

          </div>

          <div className="lawyer-search-actions">

            <button
              type="submit"
              className="lawyer-search-button"
              disabled={searching}
            >
              {searching
                ? "Searching..."
                : "🔍 Search"}
            </button>

            <button
              type="button"
              className="lawyer-clear-button"
              onClick={clearSearch}
            >
              Clear
            </button>

          </div>

        </form>

      </div>

      {/* ERROR */}

      {error && (
        <div className="lawyer-error">
          ⚠️ {error}
        </div>
      )}

      {/* RESULTS */}

      <div className="lawyer-results">

        <div className="lawyer-results-header">

          <div>
            <h2>
              Recommended Legal Professionals
            </h2>

            <p>
              {lawyers.length} lawyer
              {lawyers.length !== 1
                ? "s"
                : ""} found
            </p>
          </div>

        </div>

        {loading ? (

          <div className="lawyer-loading">
            <div className="loading-spinner"></div>

            <h3>
              Finding lawyers...
            </h3>

            <p>
              Loading available legal professionals.
            </p>
          </div>

        ) : lawyers.length === 0 ? (

          <div className="lawyer-empty">

            <div className="lawyer-empty-icon">
              🔍
            </div>

            <h3>
              No Lawyers Found
            </h3>

            <p>
              Try another city or specialization.
            </p>

          </div>

        ) : (

          <div className="lawyer-grid">

            {lawyers.map((lawyer) => (

              <div
                className="lawyer-card"
                key={lawyer.id}
              >

                <div className="lawyer-card-top">

                  <div className="lawyer-avatar">
                    {lawyer.name
                      ? lawyer.name
                          .charAt(0)
                          .toUpperCase()
                      : "L"}
                  </div>

                  <div className="lawyer-status">

                    <span
                      className={
                        lawyer.is_available
                          ? "status-dot available"
                          : "status-dot unavailable"
                      }
                    ></span>

                    {lawyer.is_available
                      ? "Available"
                      : "Unavailable"}

                  </div>

                </div>

                <h3>
                  {lawyer.name ||
                    "Legal Professional"}
                </h3>

                <div className="lawyer-specialization">
                  ⚖️{" "}
                  {lawyer.specialization ||
                    "General Law"}
                </div>

                <div className="lawyer-info">

                  <div>
                    📍{" "}
                    {lawyer.city || "N/A"}
                    {lawyer.state
                      ? `, ${lawyer.state}`
                      : ""}
                  </div>

                  <div>
                    💼{" "}
                    {lawyer.experience_years ??
                      0}{" "}
                    years experience
                  </div>

                  <div>
                    ⭐{" "}
                    {lawyer.rating ??
                      "N/A"}
                  </div>

                  <div>
                    💰 ₹
                    {lawyer.consultation_fee ??
                      "N/A"}{" "}
                    consultation
                  </div>

                </div>

                <div className="lawyer-contact">

                  {lawyer.phone && (
                    <a
                      href={`tel:${lawyer.phone}`}
                      className="lawyer-contact-button"
                    >
                      📞 Call
                    </a>
                  )}

                  {lawyer.email && (
                    <a
                      href={`mailto:${lawyer.email}`}
                      className="lawyer-contact-button"
                    >
                      ✉️ Email
                    </a>
                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* DISCLAIMER */}

      <div className="lawyer-disclaimer">

        <strong>
          ⚠️ Important
        </strong>

        <p>
          Lawyer information displayed by LexAI
          is provided for assistance and discovery.
          Please independently verify credentials,
          availability, fees and professional details
          before engaging legal services.
        </p>

      </div>

    </div>
  );
}

export default LawyerFinder;