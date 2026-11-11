import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [rowSpacing, setRowSpacing] = useState("");     // feet between crop rows
  const [plantSpacing, setPlantSpacing] = useState(""); // feet between plants in a row
  const [confidence] = useState(0.25);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isPdf =
    image && (image.type === "application/pdf" || image.name.toLowerCase().endsWith(".pdf"));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!image) return setError("Please select a file first.");
    if (!(parseFloat(rowSpacing) > 0))
      return setError("Please enter the row spacing (ft).");
    if (!(parseFloat(plantSpacing) > 0))
      return setError("Please enter the plant spacing (ft).");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("rowSpacingFt", rowSpacing);
    formData.append("plantSpacingFt", plantSpacing);
    formData.append("confidence", confidence);
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://gap-detection-1.onrender.com/api/detect", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Server error");
      }
      const result = await response.json();
      navigate("/result", { state: { result } });
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while processing the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="crop-icon">
          <svg viewBox="0 0 64 64" width="42" height="42">
            <path d="M32 58 L32 20" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 34 C22 30 16 20 18 8 C28 12 34 20 32 34 Z" fill="#2f6d4f" />
            <path d="M32 26 C42 22 48 12 46 4 C36 8 30 16 32 26 Z" fill="#5fa77e" />
          </svg>
        </div>

        <h1 className="heading">Sugarcane Gap Detection</h1>
        <p className="subtext">Upload a field image to detect gaps in sugarcane rows.</p>

        <label className="drop-zone" htmlFor="fileInput">
          <input
            id="fileInput"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={handleImageChange}
            hidden
          />
          {preview ? (
            isPdf ? (
              <div className="pdf-preview">
                <span className="pdf-badge">PDF</span>
                <span className="pdf-name">{image.name}</span>
              </div>
            ) : (
              <img src={preview} alt="Preview" className="preview-image" />
            )
          ) : (
            <div className="drop-zone-text">
              <span className="drop-zone-title">Click to upload JPG, PNG or PDF</span>
              <span className="drop-zone-sub">A clear top-down field photo works best</span>
            </div>
          )}
        </label>

        <div className="settings">
          <div className="field">
            <label htmlFor="rowSpacing">Row spacing (ft)</label>
            <input
              id="rowSpacing" type="number" min="0" step="0.1" placeholder="e.g. 4"
              value={rowSpacing} onChange={(e) => setRowSpacing(e.target.value)}
            />
            <small className="hint">Distance between two crop rows.</small>
          </div>

          <div className="field">
            <label htmlFor="plantSpacing">Plant spacing (ft)</label>
            <input
              id="plantSpacing" type="number" min="0" step="0.1" placeholder="e.g. 1"
              value={plantSpacing} onChange={(e) => setPlantSpacing(e.target.value)}
            />
            <small className="hint">Distance between plants along a row.</small>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Upload & Detect"}
        </button>
      </div>
    </div>
  );
};

export default Upload;