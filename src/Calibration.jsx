/**
 * calibration.jsx
 * -----------------------------------------------------------------------------
 * Screen calibration + unit system for a pattern-drafting app.
 *
 * THE RULE: pattern geometry is stored in MILLIMETRES, never in pixels.
 * The SVG uses a fixed internal grid (10 units = 1 mm) and only the outer
 * width/height changes when you zoom or calibrate. So one calibration fixes
 * every draft at once - neck, sleeve, dart, everything.
 * -----------------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from "react";

/* ========================= 1. UNITS =========================== */

export const MM_PER_INCH = 25.4;
export const CSS_PX_PER_INCH = 96; // fixed by the CSS spec, NOT your real screen
export const UNITS_PER_MM = 10;    // SVG internal grid: 1 mm = 10 viewBox units

// ID-1 bank / ID card. Identical worldwide. Best calibration object there is.
export const CARD_W_MM = 85.6;
export const CARD_H_MM = 53.98;

export const inToMm = (inches) => inches * MM_PER_INCH;
export const mmToIn = (mm) => mm / MM_PER_INCH;

// mm -> SVG viewBox units. Use this for EVERY coordinate you draw.
export const u = (mm) => mm * UNITS_PER_MM;

// Accept "6", "6.5", "6 1/2", "6-1/2" and return mm. Tailors write fractions.
export function parseInches(text) {
  const s = String(text).trim();
  const m = s.match(/^(\d+)?\s*(?:[-\s]\s*)?(?:(\d+)\s*\/\s*(\d+))?$/);
  if (!m || (!m[1] && !m[2])) return NaN;
  const whole = m[1] ? parseFloat(m[1]) : 0;
  const frac = m[2] && m[3] ? parseFloat(m[2]) / parseFloat(m[3]) : 0;
  return inToMm(whole + frac);
}

// Display mm as inches with the nearest 1/8", the way a tailor reads a tape.
export function formatInches(mm) {
  const total = mmToIn(mm);
  const whole = Math.floor(total);
  const eighths = Math.round((total - whole) * 8);
  if (eighths === 0) return `${whole}"`;
  if (eighths === 8) return `${whole + 1}"`;
  const g = (a, b) => (b ? g(b, a % b) : a);
  const d = g(eighths, 8);
  return `${whole ? whole + " " : ""}${eighths / d}/${8 / d}"`;
}

/* ==================== 2. CALIBRATION STATE ==================== */

const STORAGE_KEY = "pattern.screenPxPerInch";

/**
 * Returns the number of CSS pixels that equal ONE REAL PHYSICAL INCH
 * on this user's screen, plus a setter and a reset.
 *
 * Note: localStorage is used here because this is a real app file. If you run
 * this inside a sandboxed preview that blocks storage, the try/catch keeps it
 * working - it just won't remember between sessions.
 */
export function useCalibration() {
  const [pxPerInch, setPxPerInchState] = useState(() => {
    try {
      const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
      if (saved > 20 && saved < 600) return saved;
    } catch (e) {
      /* storage unavailable */
    }
    return CSS_PX_PER_INCH;
  });

  const setPxPerInch = useCallback((value) => {
    setPxPerInchState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (e) {
      /* storage unavailable */
    }
  }, []);

  const reset = useCallback(() => setPxPerInch(CSS_PX_PER_INCH), [setPxPerInch]);

  const isCalibrated = Math.abs(pxPerInch - CSS_PX_PER_INCH) > 0.01;
  const pxPerMm = pxPerInch / MM_PER_INCH;

  return { pxPerInch, pxPerMm, setPxPerInch, reset, isCalibrated };
}

/* ======= 3. BROWSER ZOOM DETECTION (calibration killer) ======= */

/**
 * Browser zoom silently invalidates calibration. Watch for it and warn.
 * devicePixelRatio changes when the user presses Ctrl +/-.
 */
export function useZoomWatch(onZoomChange) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let last = window.devicePixelRatio;
    const check = () => {
      if (Math.abs(window.devicePixelRatio - last) > 0.001) {
        last = window.devicePixelRatio;
        onZoomChange?.(last);
      }
    };
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [onZoomChange]);
}

/* =============== 4. THE CALIBRATION SCREEN ==================== */

export function CalibrationScreen({ onDone }) {
  const { pxPerInch, setPxPerInch, reset, isCalibrated } = useCalibration();
  const [zoomWarning, setZoomWarning] = useState(false);
  useZoomWatch(() => setZoomWarning(true));

  const pxPerMm = pxPerInch / MM_PER_INCH;
  const rulerInches = 5;

  return (
    <div style={S.page}>
      <h2 style={S.h2}>Match the screen to a real ruler</h2>
      <p style={S.lead}>
        Your screen does not know its own size, so drafts can print or display at
        the wrong scale. Hold a bank card or a ruler flat against the screen and
        drag the slider until the drawing below matches it exactly. You only need
        to do this once per device.
      </p>

      {zoomWarning && (
        <p style={S.warn}>
          Browser zoom changed. Set zoom back to 100% (Ctrl+0) and calibrate again.
        </p>
      )}

      {/* --- Bank card target: 85.6 x 53.98 mm, identical worldwide --- */}
      <div style={S.stage}>
        <div
          style={{
            width: CARD_W_MM * pxPerMm,
            height: CARD_H_MM * pxPerMm,
            border: "2px solid #1b3b5a",
            borderRadius: 3.18 * pxPerMm,
            display: "flex",
            alignItems: "flex-end",
            padding: 8,
            boxSizing: "border-box",
            color: "#1b3b5a",
            fontSize: 12,
          }}
        >
          bank card
        </div>

        {/* --- 5 inch ruler with 1/4 inch ticks --- */}
        <svg
          width={rulerInches * pxPerInch}
          height={46}
          viewBox={`0 0 ${rulerInches * 100} 46`}
          style={{ display: "block", overflow: "visible" }}
        >
          <line x1="0" y1="4" x2={rulerInches * 100} y2="4"
                stroke="#1b3b5a" strokeWidth="2" />
          {Array.from({ length: rulerInches * 4 + 1 }, (_, i) => {
            const x = i * 25;
            const isInch = i % 4 === 0;
            const isHalf = i % 2 === 0;
            return (
              <g key={i}>
                <line x1={x} y1="4" x2={x} y2={isInch ? 22 : isHalf ? 15 : 10}
                      stroke="#1b3b5a" strokeWidth={isInch ? 2 : 1} />
                {isInch && (
                  <text x={x} y="38" fontSize="13" textAnchor="middle" fill="#1b3b5a">
                    {i / 4}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <input
        type="range"
        min={60}
        max={260}
        step={0.25}
        value={pxPerInch}
        onChange={(e) => setPxPerInch(parseFloat(e.target.value))}
        style={S.slider}
        aria-label="Screen scale"
      />

      <div style={S.row}>
        <span style={S.readout}>{pxPerInch.toFixed(2)} px per inch</span>
        <button style={S.ghost} onClick={reset}>Start over</button>
        <button style={S.primary} onClick={() => onDone?.(pxPerInch)}>
          {isCalibrated ? "Save and continue" : "Use default scale"}
        </button>
      </div>
    </div>
  );
}

/* ============ 5. HOW YOU DRAW A PATTERN AFTER THIS ============ */

/**
 * Every pattern piece is authored in mm through u(). The same component
 * serves screen and printer - only the outer width/height changes.
 *
 * mode="screen" -> sized by the calibrated factor
 * mode="print"  -> sized in real CSS inches, which ARE exact on paper
 *                  when the user prints at 100% / "Actual size"
 */
export function PatternSheet({ widthMm, heightMm, mode = "screen", children }) {
  const { pxPerMm } = useCalibration();

  const sizing =
    mode === "print"
      ? { width: `${mmToIn(widthMm)}in`, height: `${mmToIn(heightMm)}in` }
      : { width: widthMm * pxPerMm, height: heightMm * pxPerMm };

  return (
    <svg
      {...sizing}
      viewBox={`0 0 ${u(widthMm)} ${u(heightMm)}`}
      // vector-effect on strokes keeps line weight constant at any scale
      style={{ display: "block", background: "#fff" }}
    >
      {children}
    </svg>
  );
}

/** Example: a 2 inch line that is actually 2 inches. */
export function TwoInchLine() {
  const len = inToMm(2); // 50.8 mm
  return (
    <PatternSheet widthMm={len + 20} heightMm={20}>
      <line
        x1={u(10)} y1={u(10)} x2={u(10 + len)} y2={u(10)}
        stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke"
      />
    </PatternSheet>
  );
}

/* ===================== 6. PRINT CSS =========================== */
/*
Put this in your stylesheet. It stops the browser shrinking the sheet:

@page { size: A4 portrait; margin: 0; }

@media print {
  body { margin: 0; }
  .no-print { display: none !important; }
  svg { page-break-inside: avoid; }
}

Then tell the user: in the print dialog choose Scale = 100% (or "Actual size"),
never "Fit to page". Print one calibration sheet with a 5 inch line on it and
have them measure it before cutting cloth.
*/

const S = {
  page: { maxWidth: 680, margin: "0 auto", padding: "40px 24px",
          fontFamily: "'Inter', system-ui, sans-serif", color: "#16202b" },
  h2: { fontSize: 26, fontWeight: 600, margin: "0 0 12px", letterSpacing: "-0.01em" },
  lead: { fontSize: 15, lineHeight: 1.6, color: "#4a5a6b", margin: "0 0 28px", maxWidth: "62ch" },
  warn: { background: "#fff4e5", border: "1px solid #e8c48a", padding: "10px 14px",
          fontSize: 14, borderRadius: 4, margin: "0 0 20px" },
  stage: { display: "flex", flexDirection: "column", gap: 28, alignItems: "flex-start",
           padding: "32px 0", borderTop: "1px solid #dfe4e9", borderBottom: "1px solid #dfe4e9" },
  slider: { width: "100%", margin: "28px 0 20px" },
  row: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  readout: { fontVariantNumeric: "tabular-nums", fontSize: 14, color: "#4a5a6b", marginRight: "auto" },
  ghost: { padding: "9px 16px", background: "none", border: "1px solid #c4ccd4",
           borderRadius: 4, fontSize: 14, cursor: "pointer" },
  primary: { padding: "9px 18px", background: "#1b3b5a", color: "#fff", border: "none",
             borderRadius: 4, fontSize: 14, cursor: "pointer" },
};

export default CalibrationScreen;