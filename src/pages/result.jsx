import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "../index.css";

/* ---------------- unit helpers (backend sends metres / m²) ---------------- */
const M_TO_FT = 3.28084;
const M2_TO_FT2 = 10.7639;

const toLen = (m, unit) => (m == null ? null : unit === "ft" ? m * M_TO_FT : m);
const toArea = (m2, unit) => (m2 == null ? null : unit === "ft" ? m2 * M2_TO_FT2 : m2);
const lenUnit = (u) => (u === "ft" ? "ft" : "m");
const areaUnit = (u) => (u === "ft" ? "ft²" : "m²");
const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(d));
const round2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const show = (v) => (v == null ? "-" : Number.isInteger(v) ? String(v) : v.toFixed(2));

/* ---------------- GPS / navigation helpers ---------------- */
const hasGps = (g) => g && g.lat != null && g.lon != null;

// Google Maps: with only a destination, it starts from the user's current location.
const navigationUrl = (g) =>
  `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lon}&travelmode=driving`;

/* ---------------- report data (same figures as the stat boxes on screen) ---------------- */
const buildSummary = (r, u) => {
  const L = lenUnit(u.length);
  const A = areaUnit(u.area);
  return [
    ["Total Gaps", r.gapCount, ""],
    ["Total Area", round2(toArea(r.imageAreaM2, u.area)), A],
    ["Total Rows", r.rowCount, ""],
    ["Each Row (approx.)", round2(toLen(r.rowLengthM, u.length)), L],
    ["Gap Percentage", round2(r.gapPercent), "%"],
    ["Plants for Gap Filling", r.totalPlantsNeeded, "plants"],
    ["Total Gap Length", round2(toLen(r.totalGapLengthM, u.length)), L],
  ];
};

/* ---------------- PDF ---------------- */
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/jpeg", 0.9),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = src;
  });

const buildPdf = async (result, units) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(47, 109, 79);
  doc.text("Sugarcane Gap Detection Report", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, y);

  y += 6;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Summary", "Value"]],
    body: buildSummary(result, units).map(([label, value, unit]) => [
      label,
      `${show(value)} ${unit}`.trim(),
    ]),
    theme: "grid",
    headStyles: { fillColor: [47, 109, 79] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
  });
  y = doc.lastAutoTable.finalY + 8;

  if (result.annotatedImage) {
    try {
      const img = await loadImage(result.annotatedImage);
      const maxW = pageW - margin * 2;
      const maxH = 130;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;

      if (y + h + 8 > pageH - margin) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Annotated field image", margin, y);
      y += 3;
      doc.addImage(img.dataUrl, "JPEG", margin, y, w, h);
    } catch (e) {
      console.error("Could not add image to PDF", e);
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 8, { align: "right" });
  }

  doc.save(`sugarcane-gap-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

/* ---------------- Excel ---------------- */
const buildExcel = (result, units) => {
  const summary = buildSummary(result, units);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["Metric", "Value", "Unit"], ...summary]);
  ws["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 10 }];

  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  XLSX.writeFile(wb, `sugarcane-gap-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/* ---------------- small components ---------------- */
const UnitChip = ({ unit, onToggle }) => (
  <button
    type="button"
    className="unit-chip"
    onClick={onToggle}
    title={unit === "m" ? "Show in feet" : "Show in metres"}
  >
    {unit === "m" ? "in ft" : "in m"}
  </button>
);

const Stat = ({ value, unit, label, sub, chip }) => (
  <div className="stat-box">
    {chip}
    <span className="stat-value">
      {value ?? "—"}
      {unit && <small className="stat-unit"> {unit}</small>}
    </span>
    <span className="stat-label">{label}</span>
    {sub && <span className="stat-sub">{sub}</span>}
  </div>
);

/* ---------------- page ---------------- */
const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  const [selectedId, setSelectedId] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [units, setUnits] = useState({ length: "m", area: "m" });

  if (!result) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="heading">No result found</h1>
          <p className="subtext">Please upload an image first to see the detection result.</p>
          <button onClick={() => navigate("/upload")}>Go to Upload</button>
        </div>
      </div>
    );
  }

  const {
    gapCount, totalGapLengthM, imageAreaM2, rowCount, rowLengthM,
    gapPercent, totalPlantsNeeded, gaps = [], annotatedImage,
  } = result;

  const L = lenUnit(units.length);
  const A = areaUnit(units.area);
  const allUnit = units.length === units.area ? units.length : null;

  const setAll = (u) => setUnits({ length: u, area: u });
  const flipLength = () => setUnits((s) => ({ ...s, length: s.length === "m" ? "ft" : "m" }));
  const flipArea = () => setUnits((s) => ({ ...s, area: s.area === "m" ? "ft" : "m" }));

  const selected = gaps.find((g) => g.id === selectedId) || null;
  const select = (id) => setSelectedId((cur) => (cur === id ? null : id));

  const handleNavigate = () => {
    if (!hasGps(selected)) return;
    window.open(navigationUrl(selected), "_blank", "noopener,noreferrer");
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await buildPdf(result, units);
    } catch (err) {
      console.error(err);
      alert("Could not generate the PDF report.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      buildExcel(result, units);
    } catch (err) {
      console.error(err);
      alert("Could not generate the Excel report.");
    }
  };

  return (
    <div className="page">
      {/* popup, top-right corner: Gap ID, Latitude, Longitude + Navigate */}
      {selected && (
        <div className="gap-popup">
          <div className="gap-popup-head">
            <h3>GAP DETAILS</h3>
            <span
              className="gap-close"
              role="button"
              tabIndex={0}
              aria-label="Close"
              onClick={() => setSelectedId(null)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedId(null)}
            >
              ✕
            </span>
          </div>
          <div className="gap-popup-row">
            <span>Gap ID</span>
            <strong>{selected.id}</strong>
          </div>
          <div className="gap-popup-row">
            <span>Latitude</span>
            <strong>{selected.lat != null ? selected.lat.toFixed(8) : "Not available"}</strong>
          </div>
          <div className="gap-popup-row">
            <span>Longitude</span>
            <strong>{selected.lon != null ? selected.lon.toFixed(8) : "Not available"}</strong>
          </div>

          {hasGps(selected) ? (
            <button type="button" className="gap-navigate" onClick={handleNavigate}>
              Navigate
            </button>
          ) : (
            <p className="gap-no-gps">
              No GPS data for this gap. Upload the original drone photo (not a screenshot or PDF).
            </p>
          )}
        </div>
      )}

      <div className="card dashboard-card">
        <div className="result-head">
          <h1 className="heading">Detection Result</h1>
          <div className="unit-switch" role="group" aria-label="Show all values in">
            <button type="button" className={allUnit === "m" ? "active" : ""} onClick={() => setAll("m")}>
              m
            </button>
            <button type="button" className={allUnit === "ft" ? "active" : ""} onClick={() => setAll("ft")}>
              ft
            </button>
          </div>
        </div>

        {annotatedImage && (
          <>
            <div className="image-wrap">
              <img src={annotatedImage} alt="Detected gaps" className="preview-image" />
              {gaps.map((g) =>
                g.box ? (
                  <div
                    key={g.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Gap ${g.id}`}
                    className={`gap-hit ${selectedId === g.id ? "active" : ""}`}
                    style={{
                      left: `${((g.box.x1 + g.box.x2) / 2) * 100}%`,
                      top: `${((g.box.y1 + g.box.y2) / 2) * 100}%`,
                      width: `${(g.box.x2 - g.box.x1) * 100}%`,
                      height: `${(g.box.y2 - g.box.y1) * 100}%`,
                    }}
                    onClick={() => select(g.id)}
                    onKeyDown={(e) => e.key === "Enter" && select(g.id)}
                  />
                ) : null
              )}
            </div>
            {gaps.length > 0 && (
              <p className="gap-note">
                Click a numbered box on the image to see its location and navigate to it.
              </p>
            )}
          </>
        )}

        <div className="stats-grid">
          <Stat value={gapCount} label="Total Gaps" />

          <Stat
            value={fmt(toArea(imageAreaM2, units.area))}
            unit={A}
            label="Total Area"
            chip={<UnitChip unit={units.area} onToggle={flipArea} />}
          />

          <Stat
            value={rowCount}
            label="Total Rows"
            sub={`Each row ≈ ${fmt(toLen(rowLengthM, units.length))} ${L}`}
            chip={<UnitChip unit={units.length} onToggle={flipLength} />}
          />

          <Stat
            value={`${fmt(gapPercent)}%`}
            label="Gap Percentage"
            sub={`${gapCount} gaps in total`}
          />

          <Stat value={totalPlantsNeeded} label="Plants for Gap Filling" />

          <Stat
            value={fmt(toLen(totalGapLengthM, units.length))}
            unit={L}
            label="Total Gap Length"
            chip={<UnitChip unit={units.length} onToggle={flipLength} />}
          />
        </div>

        <div className="report-actions">
          <button onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading ? "Generating PDF..." : "Download PDF Report"}
          </button>
          <button className="btn-excel" onClick={handleDownloadExcel}>
            Download Excel Sheet
          </button>
        </div>

        <button onClick={() => navigate("/upload")}>Upload Another Image</button>
      </div>
    </div>
  );
};

export default Result;