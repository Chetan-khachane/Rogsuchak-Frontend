import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./Treatment.css";
import { useDarkMode } from "../../DarkModeContext";

const Treatment = () => {
  const { isDarkMode } = useDarkMode();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // === Function to call backend ===
  const fetchTreatmentFromAI = async (diseaseName) => {
    setLoading(true);
    setError(false);
    setResults(null);

    try {
      const res = await fetch("http://10.145.168.93:3001/api/treatment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disease: diseaseName }),
      });

      if (!res.ok) throw new Error("Failed to fetch from server");

      const data = await res.json();

      setResults({
        name: data.disease,
        data: data.data,
      });
    } catch (err) {
      console.error("Error fetching from backend:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    fetchTreatmentFromAI(searchTerm.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  useEffect(() => {
    const diseaseParam = searchParams.get("disease");
    if (diseaseParam) {
      setSearchTerm(diseaseParam);
      fetchTreatmentFromAI(diseaseParam);
    }
  }, [searchParams]);

  return (
    <div className={`medicine-container ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="medicine-header">
        <div className="medicine-logo">
          <span className="logo-icon">🌳</span>
          <span className="logo-text">RogSuchak Medicine</span>
        </div>
      </div>

      <h1 className="medicine-title">Plant Disease Remedies & Solutions</h1>

      <div className="search-section">
        <h2>Search for Disease Remedies</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter disease name (e.g., Apple Scab, Tomato Blight)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="btn" onClick={handleSearch} disabled={loading}>
            {loading ? "Fetching..." : "Search Remedies"}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ Could not fetch data. Try again or check server connection.
        </div>
      )}

      {loading && <p>⏳ Getting AI-generated treatment info...</p>}

      {results && (
        <div className="remedies-section">
          <h2 className="disease-title">
            {results.name.charAt(0).toUpperCase() + results.name.slice(1)} - AI
            Generated Treatment
          </h2>

          <div className="remedies-grid">
            <div className="remedy-card">
              <h3>🌿 Organic Treatment</h3>
              <p>{results.data.organic}</p>
            </div>

            <div className="remedy-card">
              <h3>🦠 Biological Control</h3>
              <p>{results.data.biological}</p>
            </div>

            <div className="remedy-card">
              <h3>🧪 Chemical Treatment</h3>
              <p>{results.data.chemical}</p>
            </div>
          </div>

          <div className="prevention-section">
            <h3>Prevention Measures</h3>
            <ul className="prevention-list">
              {Array.isArray(results.data.prevention)
                ? results.data.prevention.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                : <li>{results.data.prevention}</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treatment;
