import { useState, useCallback } from "react";

// ─── DIN ISO 3601 Toleranztabellen (Schnurdurchmesser d2) ───────────────────
// Toleranzklasse A (Industrieanwendung), B (Standard)
const SCHNUR_TOL = {
  // d2_nom: { tolu_A, tolo_A, tolu_B, tolo_B }
  1.02:  { tolu_A: -0.08, tolo_A: 0.08, tolu_B: -0.10, tolo_B: 0.10 },
  1.27:  { tolu_A: -0.08, tolo_A: 0.08, tolu_B: -0.10, tolo_B: 0.10 },
  1.52:  { tolu_A: -0.08, tolo_A: 0.08, tolu_B: -0.10, tolo_B: 0.10 },
  1.60:  { tolu_A: -0.08, tolo_A: 0.08, tolu_B: -0.10, tolo_B: 0.10 },
  1.78:  { tolu_A: -0.08, tolo_A: 0.08, tolu_B: -0.10, tolo_B: 0.10 },
  2.00:  { tolu_A: -0.08, tolo_A: 0.08, tolu_B: -0.13, tolo_B: 0.13 },
  2.40:  { tolu_A: -0.09, tolo_A: 0.09, tolu_B: -0.13, tolo_B: 0.13 },
  2.62:  { tolu_A: -0.09, tolo_A: 0.09, tolu_B: -0.13, tolo_B: 0.13 },
  3.00:  { tolu_A: -0.10, tolo_A: 0.10, tolu_B: -0.15, tolo_B: 0.15 },
  3.53:  { tolu_A: -0.10, tolo_A: 0.10, tolu_B: -0.15, tolo_B: 0.15 },
  4.00:  { tolu_A: -0.13, tolo_A: 0.13, tolu_B: -0.20, tolo_B: 0.20 },
  5.00:  { tolu_A: -0.13, tolo_A: 0.13, tolu_B: -0.20, tolo_B: 0.20 },
  5.33:  { tolu_A: -0.13, tolo_A: 0.13, tolu_B: -0.20, tolo_B: 0.20 },
  5.72:  { tolu_A: -0.15, tolo_A: 0.15, tolu_B: -0.25, tolo_B: 0.25 },
  6.00:  { tolu_A: -0.15, tolo_A: 0.15, tolu_B: -0.25, tolo_B: 0.25 },
  6.35:  { tolu_A: -0.15, tolo_A: 0.15, tolu_B: -0.25, tolo_B: 0.25 },
  7.00:  { tolu_A: -0.20, tolo_A: 0.20, tolu_B: -0.30, tolo_B: 0.30 },
  8.00:  { tolu_A: -0.20, tolo_A: 0.20, tolu_B: -0.30, tolo_B: 0.30 },
};

// Stangentoleranzen (f7, g6, h6, h7, h8, h9, h10, js6, k6, m6, n6, p6, r6, s6) Auswahl
const STANGEN_TOL_MAP = {
  "f7":  (d) => { const [ei,es] = getISOTol(d,"f",7); return { lower: ei, upper: es }; },
  "f8":  (d) => { const [ei,es] = getISOTol(d,"f",8); return { lower: ei, upper: es }; },
  "g6":  (d) => { const [ei,es] = getISOTol(d,"g",6); return { lower: ei, upper: es }; },
  "g7":  (d) => { const [ei,es] = getISOTol(d,"g",7); return { lower: ei, upper: es }; },
  "h6":  (d) => ({ lower: 0, upper: -isoIT(d,6) }),
  "h7":  (d) => ({ lower: 0, upper: -isoIT(d,7) }),
  "h8":  (d) => ({ lower: 0, upper: -isoIT(d,8) }),
  "h9":  (d) => ({ lower: 0, upper: -isoIT(d,9) }),
  "h10": (d) => ({ lower: 0, upper: -isoIT(d,10) }),
  "k6":  (d) => { const it = isoIT(d,6); return { lower: it*0.6|0, upper: it }; },
  "m6":  (d) => { const it = isoIT(d,6); return { lower: it*0.8|0, upper: it*1.4|0 }; },
  "js6": (d) => { const it = isoIT(d,6); return { lower: -it/2, upper: it/2 }; },
  "e8":  (d) => { const [ei,es] = getISOTol(d,"e",8); return { lower: ei, upper: es }; },
  "Freifeld": () => ({ lower: null, upper: null }),
};

// ISO Grundabmaßschritte (vereinfacht)
function isoIT(d, grade) {
  // Toleranzeinheit i = 0.45 * d^(1/3) + 0.001*d
  const i = 0.45 * Math.pow(d, 1/3) + 0.001 * d;
  const factors = { 5: 7, 6: 10, 7: 16, 8: 25, 9: 40, 10: 64, 11: 100 };
  return (factors[grade] || 16) * i / 1000; // in mm
}

function getISOTol(d, letter, grade) {
  const IT = isoIT(d, grade);
  // Grundabmaße (vereinfacht, typische Werte)
  let ei, es;
  if (letter === "f") {
    // f: Grundabmaß negativ
    const fd = d <= 3 ? 0.006 : d <= 6 ? 0.010 : d <= 10 ? 0.013 : d <= 18 ? 0.016 :
               d <= 30 ? 0.020 : d <= 50 ? 0.025 : d <= 80 ? 0.030 : d <= 120 ? 0.036 :
               d <= 180 ? 0.043 : d <= 250 ? 0.050 : 0.056;
    es = -fd;
    ei = es - IT;
  } else if (letter === "g") {
    const gd = d <= 3 ? 0.002 : d <= 6 ? 0.004 : d <= 10 ? 0.005 : d <= 18 ? 0.006 :
               d <= 30 ? 0.007 : d <= 50 ? 0.009 : d <= 80 ? 0.010 : d <= 120 ? 0.012 :
               d <= 180 ? 0.014 : 0.015;
    es = -gd;
    ei = es - IT;
  } else if (letter === "e") {
    const ed = d <= 3 ? 0.014 : d <= 6 ? 0.020 : d <= 10 ? 0.025 : d <= 18 ? 0.032 :
               d <= 30 ? 0.040 : d <= 50 ? 0.050 : d <= 80 ? 0.060 : d <= 120 ? 0.072 :
               d <= 180 ? 0.085 : 0.100;
    es = -ed;
    ei = es - IT;
  } else {
    es = 0; ei = -IT;
  }
  return [ei, es];
}

// Thermische Ausdehnung
function thermalExpansion(material, T_op, T_ref = 20) {
  const alpha = { FPM: 1.5e-4, NBR: 2.0e-4, EPDM: 2.0e-4, HNBR: 2.0e-4, Baustahl: 1.2e-5, Edelstahl: 1.7e-5 };
  return (alpha[material] || 1.5e-4) * (T_op - T_ref);
}

// O-Ring Schnurdurchmesser-Toleranz interpolieren
function getSchnurTol(d2_nom, klasse) {
  const keys = Object.keys(SCHNUR_TOL).map(Number).sort((a, b) => a - b);
  let nearest = keys.reduce((prev, curr) => Math.abs(curr - d2_nom) < Math.abs(prev - d2_nom) ? curr : prev);
  const tol = SCHNUR_TOL[nearest];
  if (!tol) return { lower: -0.1, upper: 0.1 };
  return klasse === "A"
    ? { lower: tol.tolu_A, upper: tol.tolo_A }
    : { lower: tol.tolu_B, upper: tol.tolo_B };
}

// ─── Hauptberechnungsfunktion ─────────────────────────────────────────────────
function calculateOring(inputs) {
  const {
    d5_nom, d10_nom, d1_nom, d2_nom,
    d10_tolu, d10_tolo,
    d5_tolu, d5_tolo,
    toleranzklasse, stangeTol, temperatur,
    materialOR, materialStange, materialEinbauraum,
    einsatz, stuetzringe,
  } = inputs;

  const T = parseFloat(temperatur) || 20;
  const d5 = parseFloat(d5_nom);
  const d10 = parseFloat(d10_nom);
  const d1 = parseFloat(d1_nom);
  const d2 = parseFloat(d2_nom);

  if (!d5 || !d2) return null;

  // Temperaturkorrekturfaktoren
  const dT_OR = thermalExpansion(materialOR, T);
  const dT_Stange = thermalExpansion(materialStange, T);
  const dT_Einbauraum = thermalExpansion(materialEinbauraum, T);

  // Stangendurchmesser mit Toleranz
  let stange_lower, stange_upper;
  if (d5_tolu !== undefined && d5_tolu !== "" && d5_tolu !== null) {
    stange_lower = d5 + parseFloat(d5_tolu);
    stange_upper = d5 + parseFloat(d5_tolo);
  } else {
    const fn = STANGEN_TOL_MAP[stangeTol];
    const tol = fn ? fn(d5) : { lower: -0.02, upper: 0 };
    stange_lower = d5 + (tol.lower || 0);
    stange_upper = d5 + (tol.upper || 0);
  }

  // Bohrungsdurchmesser mit Toleranz
  let bohr_lower, bohr_upper;
  if (d10_tolu !== undefined && d10_tolu !== "" && d10_tolu !== null && d10) {
    bohr_lower = d10 + parseFloat(d10_tolu);
    bohr_upper = d10 + parseFloat(d10_tolo);
  } else if (d10) {
    bohr_lower = d10;
    bohr_upper = d10 + 0.05;
  }

  // O-Ring Innendurchmesser (d1) Toleranz
  let d1_lower, d1_upper;
  if (d1) {
    const tol1 = getSchnurTol(d2, toleranzklasse);
    d1_lower = d1 + tol1.lower;
    d1_upper = d1 + tol1.upper;
  }

  // O-Ring Schnur-Toleranz
  const tol2 = getSchnurTol(d2, toleranzklasse);
  const d2_lower = d2 + tol2.lower;
  const d2_upper = d2 + tol2.upper;

  // Thermisch korrigierte Werte bei Betriebstemperatur
  const d5_T_min = stange_lower * (1 + dT_Stange);
  const d5_T_max = stange_upper * (1 + dT_Stange);
  const d2_T_min = d2_lower * (1 + dT_OR);
  const d2_T_max = d2_upper * (1 + dT_OR);
  const d1_T_min = d1 ? (d1 + tol2.lower) * (1 + dT_OR) : null;
  const d1_T_max = d1 ? (d1 + tol2.upper) * (1 + dT_OR) : null;

  // ── Zentrische Lage (O-Ring auf Stangenmitte) ──
  // Verpressung [%] = (d2 - (d6-d5)/2) / d2 * 100
  // Bei Innendichtung: Verpressung = (d2_nom + d5_nom - d6_nom) / d2_nom * 100
  // d6 = Nutgrunddurchmesser (geschätzt wenn nicht angegeben)
  const d6_nom = d10 ? d10 - 2 * d2 * 0.85 : d5 + 2 * d2 * 0.75;

  // Spalt g: Zwischenraum zwischen d5 und d6
  const g_min_zent = ((d6_nom - stange_upper) / 2) - d2_T_max; // min. Spalt
  const g_max_zent = ((d6_nom - stange_lower) / 2) - d2_T_min; // max. Spalt

  // Verpressung: Quetschung des O-Ring-Querschnitts
  const v_mm_min = d2_T_min - ((d6_nom - d5_T_max) / 2);
  const v_mm_max = d2_T_max - ((d6_nom - d5_T_min) / 2);
  const v_pct_min = (v_mm_min / d2_T_max) * 100;
  const v_pct_max = (v_mm_max / d2_T_min) * 100;

  // Nutfüllung [%]
  const nutbreite_min = d1 ? 1.02 * d2_T_min : d2_T_min * 1.0;
  const nutbreite_max = d1 ? 1.02 * d2_T_max : d2_T_max * 1.08;
  const nutraum = d2_T_min * (d6_nom - d5_T_max) / 2;
  const nutfull_min = (Math.PI / 4 * d2_T_min * d2_T_min) / (nutbreite_min * Math.max(nutraum, 0.001)) * 100;
  const nutfull_max = (Math.PI / 4 * d2_T_max * d2_T_max) / (nutbreite_max * Math.max(nutraum, 0.001)) * 100;

  // Dehnung O-Ring Innen-∅
  const dehnung_min = d1_T_min ? ((d5_T_min - d1_T_min) / d1_T_min) * 100 : ((d5_T_min - d5 * 0.95) / (d5 * 0.95)) * 100;
  const dehnung_max = d1_T_max ? ((d5_T_max - d1_T_max) / d1_T_max) * 100 : ((d5_T_max - d5 * 0.95) / (d5 * 0.95)) * 100;

  // Querschnittsverminderung R [%]
  const qsv_min = Math.max(0, v_pct_min * 0.5);
  const qsv_max = Math.max(0, v_pct_max * 0.5);

  // Schnur-Ø nach Einbau [mm]
  const d2_einbau_min = d2_T_min * Math.sqrt(1 - qsv_min / 100);
  const d2_einbau_max = d2_T_max * Math.sqrt(1 - qsv_max / 100);

  // t [mm] – Differenz zwischen Nuttiefe und Schnurdurchmesser
  const t_min = ((d6_nom - d5_T_max) / 2) - d2_T_max;
  const t_max = ((d6_nom - d5_T_min) / 2) - d2_T_min;

  // Stauchung Außen-∅ [%]
  const stauch_min = 0;
  const stauch_max = 0;

  // Verpresskraft vereinfacht (Shore A ~ 70 für FPM)
  const shoreA = { FPM: 75, NBR: 70, EPDM: 65, HNBR: 72 }[materialOR] || 70;
  const E_approx = 0.0981 * (0.137445 * Math.pow(shoreA, 2) + 3.46 * shoreA - 30.5); // MPa
  const vpress_N_min = E_approx * Math.PI * d5_T_min * v_mm_min;
  const vpress_N_max = E_approx * Math.PI * d5_T_max * v_mm_max;

  // ── Exzentrische Lage ──
  const v_exz_mm_min = v_mm_min * 0.65;
  const v_exz_mm_max = v_mm_max * 1.35;
  const g_exz_min = g_min_zent * 0.5;
  const g_exz_max = g_max_zent * 1.5;
  const spalt_exz_min = Math.max(0, g_exz_min);
  const spalt_exz_max = Math.max(0, g_exz_max);
  const speicher_exz_min = Math.max(0, v_exz_mm_min);

  // Nutmaße (Nennmaß, Klein, Groß)
  const d10_NM = d10 || 0;
  const d10_KL = d10 ? (d10 + parseFloat(d10_tolu || 0)) : 0;
  const d10_GR = d10 ? (d10 + parseFloat(d10_tolo || 0.05)) : 0;

  const d5_NM = d5;
  const d5_KL = stange_lower;
  const d5_GR = stange_upper;

  const d6_NM = d6_nom;
  const d6_KL = d6_nom - 0.05;
  const d6_GR = d6_nom + 0.05;

  const b_NM = nutbreite_min;
  const b_KL = nutbreite_min * 0.98;
  const b_GR = nutbreite_max;

  const r_NM = d2 * 0.3;

  // Kontrollwerte (OK/NOK)
  const ctrl = (val, lo, hi) => val >= lo && val <= hi ? "OK" : "NOK";

  // Verpressung soll zwischen 10-30% (statisch) oder 10-25% (dynamisch)
  const v_lo = 10, v_hi = einsatz === "Dynamisch" ? 25 : 30;
  const dehnung_hi = 6; // max 6% Dehnung
  const nutfull_hi = 85; // max 85% Nutfüllung

  return {
    // Eingabewerte zurück mit Toleranzen
    d10: { nom: d10_NM, lower: d10_KL, upper: d10_GR },
    d5:  { nom: d5_NM,  lower: d5_KL,  upper: d5_GR  },
    d6:  { nom: d6_NM,  lower: d6_KL,  upper: d6_GR  },
    b:   { nom: r(b_NM), lower: r(b_KL), upper: r(b_GR) },
    r:   { nom: r(r_NM) },
    d1:  { nom: d1 || 0 },
    d2:  { nom: d2, lower: r(d2_lower), upper: r(d2_upper) },

    // Berechnungswerte zentrisch
    zent: {
      v_pct:  { min: r(v_pct_min),   max: r(v_pct_max),  ctrl_min: ctrl(v_pct_min, v_lo, v_hi), ctrl_max: ctrl(v_pct_max, v_lo, v_hi) },
      v_mm:   { min: r(v_mm_min),    max: r(v_mm_max),   ctrl_min: ctrl(v_mm_min, 0, 99),       ctrl_max: ctrl(v_mm_max, 0, 99) },
      g_mm:   { min: r(g_min_zent),  max: r(g_max_zent), ctrl_min: "—",                         ctrl_max: "—" },
      nutfull:{ min: r(nutfull_min * 0.3), max: r(nutfull_max * 0.3), ctrl_min: "—",            ctrl_max: ctrl(nutfull_max * 0.3, 0, nutfull_hi) },
      dehnung:{ min: r(dehnung_min), max: r(dehnung_max), ctrl_min: "—",                        ctrl_max: ctrl(dehnung_max, 0, dehnung_hi) },
      qsv:    { min: r(qsv_min),     max: r(qsv_max),    ctrl_min: "—",                        ctrl_max: "—" },
      d2_ein: { min: r(d2_einbau_min), max: r(d2_einbau_max) },
      t_mm:   { min: r(t_min),       max: r(t_max) },
      stauch: { min: r(stauch_min),  max: r(stauch_max) },
      vpress: { min: r(vpress_N_min), max: r(vpress_N_max) },
    },
    // Berechnungswerte exzentrisch
    exz: {
      v_mm:   { min: r(v_exz_mm_min), max: r(v_exz_mm_max) },
      g_mm:   { min: r(spalt_exz_min), max: r(spalt_exz_max) },
      speicher: { min: r(speicher_exz_min) },
      betriebsT: { min: r(T), max: r(T) },
    },
  };
}

function r(v) { return isNaN(v) ? "—" : Math.round(v * 1000) / 1000; }

// ─── UI ──────────────────────────────────────────────────────────────────────
const TABS = ["Radial Innendichtend", "Radial Außendichtend", "Axialdichtend"];

const WERKSTOFFE_OR = ["FPM", "NBR", "EPDM", "HNBR", "Silikon", "CR", "AU"];
const WERKSTOFFE_BAU = ["Baustahl", "Edelstahl", "Aluminium", "Grauguss"];
const STANGEN_TOL_OPTIONS = ["f7", "f8", "g6", "g7", "h6", "h7", "h8", "h9", "h10", "js6", "k6", "Freifeld"];
const TOL_KLASSEN = ["A", "B"];
const EINSATZ = ["Statisch", "Dynamisch"];
const EINFUERFASE = ["15°", "20°", "25°", "30°"];
const STUETZRINGE = ["ohne Stützringe", "mit einem Stützring", "mit zwei Stützringen"];

function InputField({ label, value, onChange, unit, readOnly, highlight, small }) {
  return (
    <div className={`input-row ${small ? "small" : ""}`}>
      {label && <span className="label">{label}</span>}
      <div className="field-wrap">
        <input
          type="number"
          value={value}
          onChange={e => onChange && onChange(e.target.value)}
          readOnly={readOnly}
          className={`field ${highlight ? "highlight" : ""} ${readOnly ? "readonly" : ""}`}
          step="any"
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
    </div>
  );
}

function ResultCell({ value, ctrl, label }) {
  const status = ctrl === "OK" ? "ok" : ctrl === "NOK" ? "nok" : "";
  return (
    <td>
      <div className={`result-cell ${status}`}>
        <span>{value !== undefined && value !== null && value !== "" ? value : "—"}</span>
      </div>
      {ctrl && ctrl !== "—" && <div className={`ctrl-badge ${status}`}>{ctrl}</div>}
    </td>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="select-row">
      {label && <span className="label">{label}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} className="select-field">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState(null);
  const [refnr, setRefnr] = useState("");

  const [inp, setInp] = useState({
    d5_nom: "", d10_nom: "", d1_nom: "", d2_nom: "",
    d10_tolu: "", d10_tolo: "",
    d5_tolu: "", d5_tolo: "",
    stangeTol: "f7",
    toleranzklasse: "B",
    temperatur: "20",
    materialOR: "FPM",
    materialStange: "Baustahl",
    materialEinbauraum: "Baustahl",
    einsatz: "Statisch",
    einfuerfase: "15°",
    stuetzringe: "ohne Stützringe",
  });

  const set = (k, v) => setInp(p => ({ ...p, [k]: v }));

  const calc = useCallback(() => {
    if (!inp.d5_nom || !inp.d2_nom) { alert("Bitte Wellendurchmesser d5 und Schnurdurchmesser d2 eingeben."); return; }
    const res = calculateOring(inp);
    setResults(res);
  }, [inp]);

  const reset = () => { setResults(null); setInp(p => ({ ...p, d5_nom: "", d10_nom: "", d1_nom: "", d2_nom: "", d10_tolu: "", d10_tolo: "", d5_tolu: "", d5_tolo: "", temperatur: "20" })); };

  const R = results;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">⬡</div>
          <div>
            <h1>O-Ring Rechner</h1>
            <p className="header-sub">nach DIN ISO 3601 · Auslegung & Kontrolle</p>
          </div>
          <div className="header-date">
            <span>{new Date().toLocaleDateString("de-DE")}</span>
          </div>
        </div>
        <div className="tab-bar">
          {TABS.map((t, i) => (
            <button key={t} className={`tab ${activeTab === i ? "active" : ""}`} onClick={() => setActiveTab(i)}>{t}</button>
          ))}
        </div>
      </header>

      {activeTab === 0 && (
        <div className="content">
          {/* ── Eingabebereich ── */}
          <section className="card eingabe">
            <div className="card-title">Eingabewerte</div>
            <div className="eingabe-grid">

              {/* Linke Spalte */}
              <div className="col">
                <SelectField label="Dateneingabeart" value="nach ISO 3601" onChange={() => {}} options={["nach ISO 3601"]} />
                <SelectField label="Toleranz der Stange" value={inp.stangeTol} onChange={v => set("stangeTol", v)} options={STANGEN_TOL_OPTIONS} />
                <SelectField label="Breite Einbauraum" value={inp.stuetzringe} onChange={v => set("stuetzringe", v)} options={STUETZRINGE} />

                <div className="section-label">Werkstoff</div>
                <div className="werkstoff-row">
                  <div>
                    <div className="sub-label">O-Ring</div>
                    <select className="select-field sm" value={inp.materialOR} onChange={e => set("materialOR", e.target.value)}>
                      {WERKSTOFFE_OR.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="sub-label">Stange</div>
                    <select className="select-field sm" value={inp.materialStange} onChange={e => set("materialStange", e.target.value)}>
                      {WERKSTOFFE_BAU.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="sub-label">Einbauraum</div>
                    <select className="select-field sm" value={inp.materialEinbauraum} onChange={e => set("materialEinbauraum", e.target.value)}>
                      {WERKSTOFFE_BAU.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px" }}>
                  <span className="label">Temperatur [°C]</span>
                  <input type="number" value={inp.temperatur} onChange={e => set("temperatur", e.target.value)} className="field" style={{ width: "80px" }} />
                </div>
              </div>

              {/* Mittlere Spalte */}
              <div className="col">
                <SelectField label="Einführphase" value={inp.einfuerfase} onChange={v => set("einfuerfase", v)} options={EINFUERFASE} />
                <SelectField label="Toleranz Einbauraum" value={inp.toleranzklasse === "A" ? "Klasse A" : "Klasse B"} onChange={v => set("toleranzklasse", v === "Klasse A" ? "A" : "B")} options={["Klasse A", "Klasse B"]} />
                <SelectField label="Einsatz" value={inp.einsatz} onChange={v => set("einsatz", v)} options={EINSATZ} />
              </div>

              {/* Rechte Spalte: Eingabewerte bei 20°C */}
              <div className="col right-inputs">
                <div className="tol-header-row">
                  <span className="col-title">Eingabewerte bei 20°C</span>
                  <span className="col-sub">Nennmaß</span>
                  <span className="col-sub">Untere Toleranz</span>
                  <span className="col-sub">Obere Toleranz</span>
                </div>

                {[
                  { label: "Bohrungs-∅", sym: "d10", val: inp.d10_nom, tolu: inp.d10_tolu, tolo: inp.d10_tolo, key: "d10" },
                  { label: "Wellen-∅", sym: "d5",  val: inp.d5_nom,  tolu: inp.d5_tolu,  tolo: inp.d5_tolo,  key: "d5"  },
                  { label: "O-Ring Innen-∅", sym: "d1", val: inp.d1_nom, tolu: null, tolo: null, key: "d1" },
                  { label: "O-Ring Schnur-∅", sym: "d2", val: inp.d2_nom, tolu: null, tolo: null, key: "d2" },
                ].map(row => (
                  <div className="dim-row" key={row.key}>
                    <span className="dim-label">{row.label} <em>{row.sym}</em></span>
                    <input type="number" className="field sm" value={row.val} onChange={e => set(`${row.key}_nom`, e.target.value)} placeholder="—" step="any" />
                    {row.tolu !== null ? (
                      <>
                        <input type="number" className="field sm" value={row.tolu} onChange={e => set(`${row.key}_tolu`, e.target.value)} placeholder="—" step="any" />
                        <input type="number" className="field sm" value={row.tolo} onChange={e => set(`${row.key}_tolo`, e.target.value)} placeholder="—" step="any" />
                      </>
                    ) : (
                      <>
                        <span className="field sm readonly dim-auto">nach ISO</span>
                        <span className="field sm readonly dim-auto">nach ISO</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Berechnungswerte-Tabelle rechts oben */}
              {R && (
                <div className="col berwerte-right">
                  <div className="col-title blue">Berechnungswerte · Mit Temperaturänderung</div>
                  <table className="bw-table">
                    <thead>
                      <tr><th>Nennmaß</th><th>Kleinstmaß</th><th>Größtmaß</th></tr>
                    </thead>
                    <tbody>
                      {[
                        [R.d10.nom, R.d10.lower, R.d10.upper],
                        [R.d5.nom,  R.d5.lower,  R.d5.upper],
                        [R.d6.nom,  R.d6.lower,  R.d6.upper],
                        [R.b.nom,   R.b.lower,   R.b.upper],
                        [R.r.nom,   "—",         "—"],
                        [R.d1.nom,  "—",         "—"],
                        [R.d2.nom,  R.d2.lower,  R.d2.upper],
                      ].map((row, i) => (
                        <tr key={i}>
                          {row.map((v, j) => <td key={j} className="bw-cell">{v || "—"}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="action-row">
              <button className="btn-new" onClick={reset}>＋ Neue Berechnung</button>
              <button className="btn-calc" onClick={calc}>Berechnen</button>
              <button className="btn-pdf" onClick={() => window.print()}>⬇ PDF</button>
            </div>
          </section>

          {/* ── Ergebnisbereich ── */}
          {R && (
            <section className="card ergebnis">
              <div className="ergebnis-grid">
                <div>
                  <div className="card-title blue">Berechnungswerte · Zentrische Lage</div>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>min.</th><th>Kontroll</th>
                        <th>max.</th><th>Kontroll</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Verpressung [%]",             R.zent.v_pct.min,   R.zent.v_pct.ctrl_min,   R.zent.v_pct.max,   R.zent.v_pct.ctrl_max],
                        ["Verpressung [mm]",            R.zent.v_mm.min,    R.zent.v_mm.ctrl_min,    R.zent.v_mm.max,    R.zent.v_mm.ctrl_max],
                        ["Spalt g [mm]",                R.zent.g_mm.min,    "—",                     R.zent.g_mm.max,    "—"],
                        ["Nutfüllung [%]",              R.zent.nutfull.min, "—",                     R.zent.nutfull.max, R.zent.nutfull.ctrl_max],
                        ["Dehnung OR Innen-∅ [%]",      R.zent.dehnung.min, "—",                     R.zent.dehnung.max, R.zent.dehnung.ctrl_max],
                        ["Querschnittsverminderung R [%]", R.zent.qsv.min,  "—",                     R.zent.qsv.max,     "—"],
                        ["OR Schnur-∅ [mm]",            R.zent.d2_ein.min,  "—",                     R.zent.d2_ein.max,  "—"],
                        ["t [mm]",                      R.zent.t_mm.min,    "—",                     R.zent.t_mm.max,    "—"],
                        ["Stauchung OR Aussen-∅ [%]",   R.zent.stauch.min,  "—",                     R.zent.stauch.max,  "—"],
                        ["Verpresskraft [N]",           R.zent.vpress.min,  "—",                     R.zent.vpress.max,  "—"],
                      ].map(([label, vmin, cmin, vmax, cmax]) => (
                        <tr key={label}>
                          <td className="row-label">{label}</td>
                          <ResultCell value={vmin} ctrl={cmin} />
                          <ResultCell value={vmax} ctrl={cmax} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="card-title">Exzentrische Lage</div>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>min.</th><th>Kontroll</th>
                        <th>max.</th><th>Kontroll</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Speichern [mm]",     R.exz.speicher.min, "—", "—",                 "—"],
                        ["Verpressung [mm]",   R.exz.v_mm.min,     "—", R.exz.v_mm.max,      "—"],
                        ["Spalt g [mm]",       R.exz.g_mm.min,     "—", R.exz.g_mm.max,      "—"],
                        ["Betriebstemperatur [°C]", R.exz.betriebsT.min, "—", "—",           "—"],
                      ].map(([label, vmin, cmin, vmax, cmax]) => (
                        <tr key={label}>
                          <td className="row-label">{label}</td>
                          <ResultCell value={vmin} ctrl={cmin} />
                          <ResultCell value={vmax} ctrl={cmax} />
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="refnr-row">
                    <span className="label">Referenznummer</span>
                    <input className="field refnr" value={refnr} onChange={e => setRefnr(e.target.value)} placeholder="optional" />
                  </div>
                  <div className="action-row-sm">
                    <button className="btn-save" onClick={() => alert("Gespeichert!")}>💾 Speichern</button>
                    <button className="btn-close" onClick={reset}>✕ Schliessen</button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab !== 0 && (
        <div className="content placeholder">
          <div className="placeholder-inner">
            <div className="placeholder-icon">⬡</div>
            <p>Die Berechnung für <strong>{TABS[activeTab]}</strong> ist in dieser Version noch nicht implementiert.</p>
            <p>Bitte wählen Sie <em>Radial Innendichtend</em> für die vollständige Berechnung.</p>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .app {
          font-family: 'IBM Plex Sans', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
          color: #1a1a2e;
          font-size: 13px;
        }

        .app-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
          color: #fff;
          padding: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .header-inner {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 24px 12px;
        }
        .header-logo {
          font-size: 32px; color: #e94560; line-height: 1;
          text-shadow: 0 0 20px rgba(233,69,96,0.5);
        }
        .app-header h1 { font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
        .header-sub { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; }
        .header-date { margin-left: auto; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.5); }

        .tab-bar { display: flex; gap: 0; padding: 0 16px; }
        .tab {
          padding: 10px 20px; background: transparent; border: none; color: rgba(255,255,255,0.55);
          cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 500;
          border-bottom: 3px solid transparent; transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .tab:hover { color: rgba(255,255,255,0.85); }
        .tab.active { color: #fff; border-bottom-color: #e94560; }

        .content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

        .card {
          background: #fff; border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          padding: 18px;
          border: 1px solid #e8ecf0;
        }
        .card-title {
          font-size: 13px; font-weight: 600; color: #1a1a2e;
          margin-bottom: 14px; letter-spacing: 0.3px;
          text-transform: uppercase; font-size: 11px;
          border-bottom: 2px solid #e8ecf0; padding-bottom: 8px;
        }
        .card-title.blue { color: #0057b8; border-bottom-color: #0057b8; }
        .blue { color: #0057b8 !important; }

        .eingabe-grid {
          display: grid;
          grid-template-columns: 200px 160px 1fr auto;
          gap: 20px;
          align-items: start;
        }
        .col { display: flex; flex-direction: column; gap: 8px; }

        .section-label {
          font-weight: 600; font-size: 11px; text-transform: uppercase;
          color: #555; margin-top: 8px; letter-spacing: 0.5px;
        }
        .sub-label { font-size: 10px; color: #888; margin-bottom: 3px; }
        .werkstoff-row { display: flex; gap: 8px; }

        .select-row { display: flex; gap: 8px; align-items: center; }
        .label { font-size: 11px; color: #555; white-space: nowrap; min-width: 120px; }
        .select-field {
          font-family: inherit; font-size: 11px; background: #f8f9fa;
          border: 1px solid #d0d7de; border-radius: 5px; padding: 4px 6px;
          color: #1a1a2e; flex: 1;
        }
        .select-field.sm { width: 90px; flex: none; }
        .select-field:focus { outline: none; border-color: #0057b8; }

        .field {
          font-family: 'IBM Plex Mono', monospace; font-size: 12px;
          background: #e8f4ff; border: 1px solid #b8d4f0;
          border-radius: 4px; padding: 4px 6px; width: 80px;
          color: #1a1a2e; text-align: right;
        }
        .field.sm { width: 68px; }
        .field:focus { outline: none; border-color: #0057b8; background: #d4eaff; }
        .field.readonly { background: #f0f0f0; border-color: #ddd; color: #666; cursor: default; }
        .field.highlight { background: #fff9e6; border-color: #f0b429; }

        /* Dim-Row (Bohrungs-∅, Wellen-∅ etc.) */
        .tol-header-row {
          display: grid; grid-template-columns: 120px 68px 80px 80px;
          gap: 6px; align-items: center; margin-bottom: 6px;
        }
        .col-title { font-weight: 600; font-size: 11px; color: #0057b8; }
        .col-sub { font-size: 10px; color: #888; text-align: center; }
        .dim-row {
          display: grid; grid-template-columns: 120px 68px 80px 80px;
          gap: 6px; align-items: center; margin-bottom: 4px;
        }
        .dim-label { font-size: 11px; color: #444; }
        .dim-label em { font-style: italic; color: #0057b8; font-size: 11px; }
        .dim-auto { display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; height: 26px; }

        /* Berechnungswerte rechts oben */
        .berwerte-right { min-width: 220px; }
        .bw-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .bw-table th { background: #1a1a2e; color: #fff; padding: 4px 6px; text-align: center; font-weight: 500; font-size: 10px; }
        .bw-cell { background: #e8f4ff; border: 1px solid #d0e8ff; padding: 3px 6px; text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 11px; }
        .bw-table tr:nth-child(even) .bw-cell { background: #f0f8ff; }

        .action-row { display: flex; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e8ecf0; }
        .btn-new {
          padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer;
          background: #0057b8; color: #fff; font-family: inherit; font-size: 12px; font-weight: 600;
          display: flex; align-items: center; gap: 6px;
          transition: all 0.2s;
        }
        .btn-new:hover { background: #003d8a; }
        .btn-calc {
          padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer;
          background: #e94560; color: #fff; font-family: inherit; font-size: 12px; font-weight: 600;
          transition: all 0.2s;
        }
        .btn-calc:hover { background: #c0392b; }
        .btn-pdf {
          padding: 8px 16px; border-radius: 6px; cursor: pointer;
          background: #f8f9fa; color: #555; border: 1px solid #ddd; font-family: inherit; font-size: 12px;
          transition: all 0.2s;
        }
        .btn-pdf:hover { background: #e8ecf0; }

        /* Ergebnisse */
        .ergebnis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        .result-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .result-table th {
          background: #1a1a2e; color: #fff; padding: 6px 8px;
          font-size: 10px; font-weight: 500; text-align: center;
        }
        .result-table th:first-child { text-align: left; }
        .result-table tr:nth-child(even) { background: #f8f9fa; }
        .result-table tr:hover { background: #e8f4ff; }
        .row-label { padding: 4px 8px; color: #333; font-size: 11px; }

        .result-cell {
          background: #e8f4ff; border: 1px solid #c8dff5;
          border-radius: 3px; padding: 3px 6px;
          font-family: 'IBM Plex Mono', monospace; font-size: 11px;
          text-align: right; min-width: 60px; display: block;
        }
        .result-cell.ok { background: #d4f4e0; border-color: #7ed9a7; color: #1a6b3c; }
        .result-cell.nok { background: #fde8e8; border-color: #f5a0a0; color: #8b0000; }

        .ctrl-badge {
          font-size: 9px; font-weight: 700; text-align: center;
          border-radius: 2px; padding: 1px 3px; margin-top: 2px;
        }
        .ctrl-badge.ok { background: #d4f4e0; color: #1a6b3c; }
        .ctrl-badge.nok { background: #fde8e8; color: #8b0000; }

        td { padding: 2px 4px; vertical-align: middle; }

        .refnr-row {
          display: flex; align-items: center; gap: 8px;
          margin-top: 16px; padding: 10px;
          background: #fff9e6; border: 1px solid #f0d060;
          border-radius: 6px;
        }
        .field.refnr { background: #fffbf0; border-color: #f0c040; width: 140px; text-align: left; }

        .action-row-sm { display: flex; gap: 8px; margin-top: 12px; }
        .btn-save {
          padding: 7px 14px; border-radius: 5px; border: 1px solid #b0c4de;
          background: #f0f4fa; font-family: inherit; font-size: 11px; cursor: pointer;
        }
        .btn-save:hover { background: #d8e8f5; }
        .btn-close {
          padding: 7px 14px; border-radius: 5px; border: 1px solid #f0a0a0;
          background: #fde8e8; font-family: inherit; font-size: 11px; cursor: pointer; color: #8b0000;
        }
        .btn-close:hover { background: #f5c5c5; }

        .placeholder { min-height: 300px; display: flex; align-items: center; justify-content: center; }
        .placeholder-inner { text-align: center; color: #888; }
        .placeholder-icon { font-size: 48px; color: #ddd; margin-bottom: 16px; }
        .placeholder-inner p { margin-bottom: 8px; }

        @media print {
          .app-header, .action-row, .action-row-sm, .tab-bar { display: none; }
          .app { background: #fff; }
          .card { box-shadow: none; border: 1px solid #ddd; }
        }
      `}</style>
    </div>
  );
}
