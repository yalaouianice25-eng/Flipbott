import { useState, useRef } from "react";

const API = "/api/analyze";

export default function App() {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleImage = (file) => {
    setImage(URL.createObjectURL(file));
  };

  const analyze = async () => {
    if (!url && !description) {
      setError("Entre un lien ou une description.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    const steps = ["Lecture de l'annonce Vinted...", "Recherche des prix du marché...", "Analyse des ventes récentes...", "Calcul des marges réelles...", "Génération du verdict..."];
    let i = 0;
    setLoadingStep(steps[0]);
    const iv = setInterval(() => { i = (i + 1) % steps.length; setLoadingStep(steps[i]); }, 2000);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, description, price }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError("Erreur : " + e.message);
    }
    clearInterval(iv);
    setLoading(false);
  };

  const reset = () => { setResult(null); setUrl(""); setDescription(""); setPrice(""); setImage(null); setError(""); };

  const v = result?.analysis;
  const verdict = v?.verdict?.decision;
  const verdictConfig = {
    ACHETE: { bg: "#0a2e1a", border: "#00c853", icon: "✅", label: "ACHÈTE DIRECT", color: "#00c853" },
    NEGOCIE: { bg: "#2e1f00", border: "#ff9800", icon: "🤝", label: "NÉGOCIE", color: "#ff9800" },
    PASSE: { bg: "#2e0a0a", border: "#f44336", icon: "🚫", label: "PASSE", color: "#f44336" },
  };
  const vc = verdictConfig[verdict] || verdictConfig["PASSE"];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#fff", fontFamily: "system-ui, sans-serif", padding: "0 0 80px" }}>
      <style>{`* { box-sizing: border-box; } input, textarea { outline: none; } @keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      <div style={{ background: "#111", borderBottom: "1px solid #222", padding: "16px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>💹</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>FlipBot</div>
            <div style={{ fontSize: 11, color: "#555" }}>Analyse Vinted en temps réel</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
        {!result && !loading && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>🔗 Lien Vinted</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.vinted.fr/items/..." style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>📝 Description <span style={{ color: "#444" }}>(marque, modèle, taille, état)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Pull Ralph Lauren enfant 4 ans bleu très bon état" rows={3} style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color:
