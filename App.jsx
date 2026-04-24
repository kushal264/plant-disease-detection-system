import { useState, useRef, useCallback } from "react";

const API = "http://localhost:8000";

const CROPS = [
  { id: "potato", label: "Potato", emoji: "🥔" },
  { id: "tomato", label: "Tomato", emoji: "🍅" },
];

const SEVERITY_COLOR = (confidence) => {
  if (confidence >= 0.85) return "#e74c3c";
  if (confidence >= 0.60) return "#f39c12";
  return "#27ae60";
};

export default function App() {
  const [crop, setCrop] = useState("potato");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("original"); // "original" | "heatmap"
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
    setTab("original");
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("crop", crop);
      const res = await fetch(`${API}/explain`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
      setTab("original");
    } catch (err) {
      setError(err.message || "Failed to connect to the API.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div style={styles.root}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#16a34a" opacity="0.15"/>
              <path d="M14 5 C14 5 8 10 8 16 C8 19.3 10.7 22 14 22 C17.3 22 20 19.3 20 16 C20 10 14 5 14 5Z" fill="#16a34a"/>
              <path d="M14 10 L14 22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 15 L10.5 12" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M14 13 L17 11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={styles.logoText}>PlantGuard AI</span>
          </div>
          <span style={styles.tagline}>Disease Detection · Explainable AI</span>
        </div>
      </header>

      <main style={styles.main}>
        {/* ── Crop Selector ───────────────────────────────── */}
        <section style={styles.section}>
          <p style={styles.label}>Select crop</p>
          <div style={styles.cropRow}>
            {CROPS.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCrop(c.id); setResult(null); }}
                style={{
                  ...styles.cropBtn,
                  ...(crop === c.id ? styles.cropBtnActive : {}),
                }}
              >
                <span style={{ fontSize: 22 }}>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Upload Area ─────────────────────────────────── */}
        {!preview && (
          <section
            style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <div style={styles.dropIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="12" fill="#dcfce7"/>
                <path d="M20 12 L20 26M13 19 L20 12 L27 19" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 29 L27 29" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={styles.dropTitle}>Drop a leaf image here</p>
            <p style={styles.dropSub}>or click to browse · JPG, PNG, WEBP</p>
          </section>
        )}

        {/* ── Image Preview + Analyze ──────────────────────── */}
        {preview && !result && (
          <section style={styles.previewSection}>
            <div style={styles.previewWrap}>
              <img src={preview} alt="preview" style={styles.previewImg} />
              <button style={styles.clearBtn} onClick={reset} title="Remove">✕</button>
            </div>
            <button
              style={{ ...styles.analyzeBtn, ...(loading ? styles.analyzeBtnDisabled : {}) }}
              onClick={analyze}
              disabled={loading}
            >
              {loading ? (
                <span style={styles.spinnerRow}>
                  <span style={styles.spinner} /> Analyzing…
                </span>
              ) : (
                "Analyze Plant 🔬"
              )}
            </button>
          </section>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
            <br/>
            <small>Make sure your FastAPI server is running on port 8000.</small>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────── */}
        {result && (
          <section style={styles.resultsSection}>
            {/* ── Top: images side by side ── */}
            <div style={styles.imagesRow}>
              {/* Tab switcher */}
              <div style={styles.tabBar}>
                <button
                  style={{ ...styles.tabBtn, ...(tab === "original" ? styles.tabBtnActive : {}) }}
                  onClick={() => setTab("original")}
                >Original</button>
                <button
                  style={{ ...styles.tabBtn, ...(tab === "heatmap" ? styles.tabBtnActive : {}) }}
                  onClick={() => setTab("heatmap")}
                >Grad-CAM Heatmap</button>
              </div>
              <div style={styles.imageDisplay}>
                <img
                  src={
                    tab === "heatmap" && result.heatmap
                      ? `data:image/png;base64,${result.heatmap}`
                      : preview
                  }
                  alt={tab}
                  style={styles.resultImg}
                />
                {tab === "heatmap" && (
                  <div style={styles.heatmapCaption}>
                    🔴 Red areas = regions the model focused on most
                  </div>
                )}
              </div>
            </div>

            {/* ── Prediction card ── */}
            <div style={styles.predCard}>
              <div style={styles.predTop}>
                <div>
                  <p style={styles.predLabel}>Detected disease</p>
                  <p style={styles.predClass}>{result.class}</p>
                  <p style={styles.predCrop}>Crop: {result.crop.charAt(0).toUpperCase() + result.crop.slice(1)}</p>
                </div>
                <div style={styles.confidenceCircle(result.confidence)}>
                  <span style={styles.confidencePct}>{Math.round(result.confidence * 100)}%</span>
                  <span style={styles.confidenceLabel}>confidence</span>
                </div>
              </div>

              {/* Confidence bar */}
              <div style={styles.barBg}>
                <div style={{
                  ...styles.barFill,
                  width: `${Math.round(result.confidence * 100)}%`,
                  background: SEVERITY_COLOR(result.confidence),
                }} />
              </div>

              {/* Description */}
              {result.description && (
                <p style={styles.description}>{result.description}</p>
              )}
            </div>

            {/* ── Precautions ── */}
            {result.precautions?.length > 0 && (
              <div style={styles.infoCard}>
                <div style={styles.infoHeader}>
                  <span style={styles.infoIcon}>🛡️</span>
                  <span style={styles.infoTitle}>Precautions</span>
                </div>
                <ul style={styles.list}>
                  {result.precautions.map((p, i) => (
                    <li key={i} style={styles.listItem}>
                      <span style={styles.bullet} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Solutions ── */}
            {result.solutions?.length > 0 && (
              <div style={{ ...styles.infoCard, ...styles.solutionCard }}>
                <div style={styles.infoHeader}>
                  <span style={styles.infoIcon}>💊</span>
                  <span style={styles.infoTitle}>Treatment & Solutions</span>
                </div>
                <ul style={styles.list}>
                  {result.solutions.map((s, i) => (
                    <li key={i} style={styles.listItem}>
                      <span style={{ ...styles.bullet, background: "#16a34a" }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Healthy message ── */}
            {result.class === "Healthy" && (
              <div style={styles.healthyBox}>
                ✅ Your plant looks healthy! Keep monitoring regularly.
              </div>
            )}

            {/* ── Analyze another ── */}
            <button style={styles.resetBtn} onClick={reset}>
              Analyze another image
            </button>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        PlantGuard AI · Final Year Project · Powered by CNN + Grad-CAM XAI
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0fdf4; font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#f0fdf4",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "white",
    borderBottom: "1px solid #dcfce7",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 680,
    margin: "0 auto",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: "#14532d",
  },
  tagline: {
    fontSize: 12,
    color: "#86efac",
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  main: {
    flex: 1,
    maxWidth: 680,
    margin: "0 auto",
    width: "100%",
    padding: "32px 20px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  section: {},
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 10,
  },
  cropRow: {
    display: "flex",
    gap: 12,
  },
  cropBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    border: "1.5px solid #dcfce7",
    background: "white",
    fontSize: 15,
    fontWeight: 500,
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  cropBtnActive: {
    border: "1.5px solid #16a34a",
    background: "#f0fdf4",
    color: "#14532d",
  },
  dropzone: {
    border: "2px dashed #86efac",
    borderRadius: 20,
    background: "white",
    padding: "52px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  dropzoneActive: {
    border: "2px dashed #16a34a",
    background: "#f0fdf4",
  },
  dropIcon: { marginBottom: 16, display: "flex", justifyContent: "center" },
  dropTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: "#14532d",
    marginBottom: 6,
  },
  dropSub: { fontSize: 13, color: "#9ca3af" },
  previewSection: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    animation: "fadeUp 0.3s ease",
  },
  previewWrap: { position: "relative", display: "inline-block", alignSelf: "center" },
  previewImg: {
    width: "100%",
    maxWidth: 400,
    maxHeight: 300,
    objectFit: "cover",
    borderRadius: 16,
    display: "block",
    border: "1px solid #dcfce7",
  },
  clearBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "rgba(0,0,0,0.55)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: 28,
    height: 28,
    cursor: "pointer",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzeBtn: {
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "15px 32px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "'DM Sans', sans-serif",
    alignSelf: "stretch",
  },
  analyzeBtnDisabled: {
    background: "#86efac",
    cursor: "not-allowed",
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  spinner: {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 12,
    padding: "16px 20px",
    color: "#991b1b",
    fontSize: 14,
    lineHeight: 1.6,
  },
  resultsSection: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    animation: "fadeUp 0.35s ease",
  },
  imagesRow: {
    background: "white",
    borderRadius: 20,
    border: "1px solid #dcfce7",
    overflow: "hidden",
  },
  tabBar: {
    display: "flex",
    borderBottom: "1px solid #dcfce7",
  },
  tabBtn: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    color: "#6b7280",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  tabBtnActive: {
    color: "#16a34a",
    borderBottom: "2px solid #16a34a",
    background: "#f0fdf4",
  },
  imageDisplay: { padding: 16, textAlign: "center" },
  resultImg: {
    width: "100%",
    maxHeight: 300,
    objectFit: "cover",
    borderRadius: 12,
  },
  heatmapCaption: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
  },
  predCard: {
    background: "white",
    borderRadius: 20,
    border: "1px solid #dcfce7",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  predTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  predLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 4,
  },
  predClass: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26,
    color: "#14532d",
    lineHeight: 1.2,
  },
  predCrop: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  confidenceCircle: (conf) => ({
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: `3px solid ${SEVERITY_COLOR(conf)}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  confidencePct: {
    fontSize: 18,
    fontWeight: 700,
    color: "#14532d",
    lineHeight: 1,
  },
  confidenceLabel: {
    fontSize: 9,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  barBg: {
    height: 7,
    background: "#f3f4f6",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.6s ease",
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 1.7,
  },
  infoCard: {
    background: "white",
    borderRadius: 20,
    border: "1px solid #dcfce7",
    padding: "18px 22px",
  },
  solutionCard: {
    borderColor: "#bbf7d0",
    background: "#f0fdf4",
  },
  infoHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  infoIcon: { fontSize: 18 },
  infoTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#14532d",
  },
  list: { listStyle: "none", display: "flex", flexDirection: "column", gap: 10 },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.6,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#f59e0b",
    marginTop: 7,
    flexShrink: 0,
  },
  healthyBox: {
    background: "#dcfce7",
    borderRadius: 14,
    padding: "16px 20px",
    color: "#14532d",
    fontSize: 15,
    fontWeight: 500,
  },
  resetBtn: {
    background: "transparent",
    border: "1.5px solid #16a34a",
    color: "#16a34a",
    borderRadius: 14,
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  footer: {
    textAlign: "center",
    padding: "20px",
    fontSize: 12,
    color: "#9ca3af",
    borderTop: "1px solid #dcfce7",
  },
};
