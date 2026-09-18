
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const Upload = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const result = await response.json();
      navigate("/result", { state: { result } });
    } catch (err) {
      console.error(err);
      setError("Something went wrong while processing the image.");
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
        <p className="subtext">
          Upload a field image to detect gaps in sugarcane rows.
        </p>

        <label className="drop-zone" htmlFor="fileInput">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />

          {preview ? (
            <img src={preview} alt="Preview" className="preview-image" />
          ) : (
            <div className="drop-zone-text">
              <span className="drop-zone-title">Click to select an image</span>
              <span className="drop-zone-sub">A clear field photo works best</span>
            </div>
          )}
        </label>

        {error && <p className="error">{error}</p>}

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Upload & Detect"}
        </button>
      </div>
    </div>
  );
};

export default Upload;