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
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>💶 Prix demandé (€)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Ex: 12" type="number" style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>📷 Photo <span style={{ color: "#444" }}>(optionnel)</span></label>
              <div onClick={() => fileRef.current.click()} style={{ border: `1.5px dashed ${image ? "#00c853" : "#333"}`, borderRadius: 10, padding: 16, cursor: "pointer", background: "#1a1a1a", textAlign: "center" }}>
                {image ? <div><img src={image} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} /><div style={{ color: "#00c853", fontSize: 12, marginTop: 6 }}>Photo chargée ✓</div></div> : <div><div style={{ fontSize: 28 }}>📷</div><div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>Clique pour ajouter une photo</div></div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImage(e.target.files[0])} />
            </div>
            {error && <div style={{ background: "#2e0a0a", border: "1px solid #f44336", borderRadius: 8, padding: "10px 14px", color: "#f44336", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <button onClick={analyze} style={{ width: "100%", background: "linear-gradient(135deg, #00c853, #009624)", border: "none", borderRadius: 12, padding: 15, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>🔍 Analyser l'article</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #222", borderTop: "3px solid #00c853", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <div style={{ color: "#00c853", fontSize: 13, marginTop: 20, animation: "pulse 1.4s infinite" }}>{loadingStep}</div>
          </div>
        )}

        {result && !loading && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ background: vc.bg, border: `2px solid ${vc.border}`, borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>{vc.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: vc.color }}>{vc.label}</div>
              <div style={{ color: "#ccc", fontSize: 14, marginTop: 8 }}>{v?.verdict?.raison}</div>
              {verdict === "NEGOCIE" && (
                <div style={{ marginTop: 14, background: "#1a1500", border: "1px solid #ff9800", borderRadius: 10, padding: 12 }}>
                  <div style={{ color: "#ff9800", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Prix de négociation</div>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <div style={{ textAlign: "center" }}><div style={{ color: "#888", fontSize: 11 }}>Minimum</div><div style={{ color: "#ff9800", fontSize: 18, fontWeight: 800 }}>{v?.verdict?.prix_negociation_minimum}€</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ color: "#888", fontSize: 11 }}>Idéal</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>{v?.verdict?.prix_negociation_ideal}€</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ color: "#888", fontSize: 11 }}>Maximum</div><div style={{ color: "#ff9800", fontSize: 18, fontWeight: 800 }}>{v?.verdict?.prix_negociation_maximum}€</div></div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#00c853", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Calcul complet</div>
              <Row label="Prix article" value={`${v?.achat?.prix_article}€`} />
              <Row label="Frais livraison" value={`${v?.achat?.frais_livraison}€`} />
              <Row label="Protection acheteur" value={`${v?.achat?.frais_protection}€`} />
              <Row label="COÛT TOTAL RÉEL" value={`${v?.achat?.cout_total_reel}€`} bold />
              <Row label="Prix revente conseillé" value={`${v?.revente?.prix_revente_conseille}€`} color="#00c853" />
              <Row label="Fourchette" value={`${v?.revente?.prix_revente_min}€ — ${v?.revente?.prix_revente_max}€`} />
              <div style={{ background: "#0a2e1a", border: "1px solid #00c853", borderRadius: 10, padding: "12px 14px", marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>Marge nette</span>
                <span style={{ color: "#00c853", fontSize: 22, fontWeight: 900 }}>{v?.revente?.marge_nette}€ (+{v?.revente?.rentabilite_pct}%)</span>
              </div>
            </div>

            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#00c853", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Marché Vinted réel</div>
              <Row label="Annonces trouvées" value={`${result.marketData?.count} articles`} />
              <Row label="Prix minimum" value={`${v?.marche?.prix_minimum}€`} />
              <Row label="Prix médian" value={`${v?.marche?.prix_median}€`} />
              <Row label="Prix maximum" value={`${v?.marche?.prix_maximum}€`} />
              <Row label="Délai revente" value={`${v?.marche?.delai_revente_jours} jours`} />
              <Row label="Demande" value={v?.marche?.demande?.toUpperCase()} color={v?.marche?.demande === "forte" ? "#00c853" : v?.marche?.demande === "moyenne" ? "#ff9800" : "#f44336"} />
            </div>

            {result.marketData?.prices?.length > 0 && (
              <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#00c853", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Prix trouvés ({result.marketData.prices.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.marketData.prices.slice(0, 20).map((p, i) => {
                    const median = v?.marche?.prix_median || 0;
                    const isGood = p <= median * 0.85;
                    return <div key={i} style={{ background: isGood ? "#0d2010" : "#1a1a1a", border: `1px solid ${isGood ? "#4caf50" : "#333"}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, color: isGood ? "#4caf50" : "#aaa" }}>{p}€</div>;
                  })}
                </div>
              </div>
            )}

            {v?.verdict?.conseil && (
              <div style={{ background: "#111", border: "1px solid #333", borderLeft: "3px solid #00c853", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#00c853", fontWeight: 700, marginBottom: 6 }}>💡 CONSEIL</div>
                <div style={{ color: "#ddd", fontSize: 14, lineHeight: 1.6 }}>{v.verdict.conseil}</div>
              </div>
            )}

            <button onClick={reset} style={{ width: "100%", background: "none", border: "1px solid #333", borderRadius: 12, padding: 13, color: "#555", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← Analyser un autre article</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
      <span style={{ color: "#666", fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color || "#fff", fontSize: 14, fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}
