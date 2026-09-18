import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../index.css";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="heading">No result found</h1>
          <p className="subtext">
            Please upload an image first to see the detection result.
          </p>
          <button onClick={() => navigate("/upload")}>Go to Upload</button>
        </div>
      </div>
    );
  }

  const {
    gapCount = "—",
    totalPlants = "—",
    gapPercentage = "—",
    annotatedImage = null,
  } = result;

  return (
    <div className="page">
      <div className="card dashboard-card">
        <h1 className="heading">Detection Result</h1>
        <p className="subtext">
          Here's what we found in your sugarcane field image.
        </p>

        {annotatedImage && (
          <img
            src={annotatedImage}
            alt="Detected result"
            className="preview-image"
          />
        )}

        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-value">{gapCount}</span>
            <span className="stat-label">Gaps Detected</span>
          </div>
        </div>

        <button onClick={() => navigate('/upload')}>
          Upload Another Image
        </button>
      </div>
    </div>
  );
};

export default Result;