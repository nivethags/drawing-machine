// =========================================================
// FRONT NECK PATTI CALCULATION
// =========================================================
//
// Applicable Chest:
// 30" to 38"
//
// Patti dimensions:
// Total Width  = 12"
// Left Height  = 3.5"
// Center Dip   = 2.5"
// Right Height = 3.5"
//
// The bottom edge is straight.
// The top edge is a smooth continuous curve.
//
// Scale:
// 1 inch = 29.5 SVG units
// =========================================================

export const generateFrontNeckPattiPattern = (
  measurements = {},
  offsetX = 0,
  offsetY = 0,
  scale = 29.5
) => {
  const chest = Number(measurements.chest);

  // =========================================================
  // CHEST VALIDATION
  // =========================================================

  if (!Number.isFinite(chest)) {
    return null;
  }

  // Patti is available only for chest 30" - 38"
  if (chest < 30 || chest > 38) {
    return null;
  }

  // =========================================================
  // MEASUREMENTS
  // =========================================================

  const totalWidth = 12;
  const leftHeight = 3.5;
  const centerDip = 2.5;
  const rightHeight = 3.5;

  // =========================================================
  // SCALE CONVERSION
  // =========================================================

  const toPx = (value) => value * scale;

  const widthPx = toPx(totalWidth);
  const leftHeightPx = toPx(leftHeight);
  const centerDipPx = toPx(centerDip);
  const rightHeightPx = toPx(rightHeight);

  // =========================================================
  // MAIN POINTS
  // =========================================================
  //
  // A = Hook / Left / Center Front
  // M = Exact center dip
  // D = Side Seam / Right
  // B = Left Bottom
  // C = Right Bottom
  //
  // SVG Y increases downward.
  //
  // A = 0"
  // M = 2.5"
  // D = 0"
  //
  // Therefore the actual center of the curve is exactly
  // 2.5" below A/D.
  // =========================================================

  const A = {
    x: offsetX,
    y: offsetY,
  };

  const D = {
    x: offsetX + widthPx,
    y: offsetY,
  };

  const B = {
    x: offsetX,
    y: offsetY + leftHeightPx,
  };

  const C = {
    x: offsetX + widthPx,
    y: offsetY + rightHeightPx,
  };

  // -----------------------------------------------------
  // M is now measured from the BOTTOM line (B–C midpoint),
  // going UP 2.5" toward the top.
  // -----------------------------------------------------

  const bottomMidY = (B.y + C.y) / 2;

  const M = {
    x: offsetX + widthPx / 2,
    y: bottomMidY - centerDipPx,
  };

  // =========================================================
  // TOP CURVE CONTROL POINTS
  // =========================================================
  //
  // The top edge is made using TWO cubic Bézier curves:
  //
  // A → M
  // M → D
  //
  // M is an actual point on the curve.
  //
  // This creates a smooth continuous curve through:
  //
  // A
  //       \
  //        \
  //         M
  //        /
  //       /
  //      D
  //
  // The control points determine the smoothness of the curve.
  // =========================================================

  // How far (horizontally) the curve control points sit from M.
  // Larger = flatter/wider bottom, smaller = tighter/rounder dip.
  const curveSpread = widthPx * 0.28;

  const topCurveControl1 = {
    x: A.x + widthPx * 0.15,
    y: A.y + (M.y - A.y) * 0.35,
  };

  const topCurveControl2 = {
    x: M.x - curveSpread,
    y: M.y, // horizontal tangent approaching M
  };

  const topCurveControl3 = {
    x: M.x + curveSpread,
    y: M.y, // horizontal tangent leaving M (mirrors control2)
  };

  const topCurveControl4 = {
    x: D.x - widthPx * 0.15,
    y: D.y + (M.y - D.y) * 0.35,
  };

  // =========================================================
  // MAIN PATTERN PATH
  // =========================================================

  const path = `
    M ${A.x} ${A.y}

    C
      ${topCurveControl1.x} ${topCurveControl1.y},
      ${topCurveControl2.x} ${topCurveControl2.y},
      ${M.x} ${M.y}

    C
      ${topCurveControl3.x} ${topCurveControl3.y},
      ${topCurveControl4.x} ${topCurveControl4.y},
      ${D.x} ${D.y}

    L ${C.x} ${C.y}

    L ${B.x} ${B.y}

    L ${A.x} ${A.y}

    Z
  `;

  // =========================================================
  // GUIDES
  // =========================================================

  const guides = {
    leftHeight: `
      M ${A.x} ${A.y}
      L ${B.x} ${B.y}
    `,

    rightHeight: `
      M ${D.x} ${D.y}
      L ${C.x} ${C.y}
    `,

    // Drawn from the bottom (B/C midpoint) up to M
    centerDip: `
      M ${M.x} ${(B.y + C.y) / 2}
      L ${M.x} ${M.y}
    `,

    centerWidth: `
      M ${A.x} ${M.y}
      L ${M.x} ${M.y}
    `,

    topReference: `
      M ${A.x} ${A.y}
      L ${D.x} ${D.y}
    `,

    bottomReference: `
      M ${B.x} ${B.y}
      L ${C.x} ${C.y}
    `,
  };

  // =========================================================
  // POINT STYLES
  // =========================================================

  const pointStyles = {
    A: {
      radius: 4,
      color: "#009933",
    },

    M: {
      radius: 4,
      color: "#009933",
    },

    D: {
      radius: 4,
      color: "#009933",
    },

    B: {
      radius: 4,
      color: "#009933",
    },

    C: {
      radius: 4,
      color: "#009933",
    },
  };

  // =========================================================
  // POINT LABELS
  // =========================================================

  const pointLabels = {
    A: {
      text: "A",
      color: "#009933",
    },

    M: {
      text: "M",
      color: "#009933",
    },

    D: {
      text: "D",
      color: "#009933",
    },

    B: {
      text: "B",
      color: "#009933",
    },

    C: {
      text: "C",
      color: "#009933",
    },
  };

  // =========================================================
  // NAMED POINTERS
  // =========================================================
  //
  // These identify the drafting purpose of each point.
  // =========================================================

  const pointers = {
    A: {
      name: "A",
      label: "Hook / Left",
      point: A,
    },

    M: {
      name: "M",
      label: "Center Dip",
      point: M,
    },

    D: {
      name: "D",
      label: "Side Seam / Right",
      point: D,
    },

    B: {
      name: "B",
      label: "Left Bottom",
      point: B,
    },

    C: {
      name: "C",
      label: "Right Bottom",
      point: C,
    },
  };

  // =========================================================
  // CONTROL POINTS
  // =========================================================

  const controlPoints = {
    topCurveControl1,
    topCurveControl2,
    topCurveControl3,
    topCurveControl4,
  };

  // =========================================================
  // CONTROL POINT POINTERS
  // =========================================================

  const controlPointPointers = {
    PC1: {
      name: "PC1",
      label: "Top Curve Control 1",
      point: topCurveControl1,
    },

    PC2: {
      name: "PC2",
      label: "Top Curve Control 2",
      point: topCurveControl2,
    },

    PC3: {
      name: "PC3",
      label: "Top Curve Control 3",
      point: topCurveControl3,
    },

    PC4: {
      name: "PC4",
      label: "Top Curve Control 4",
      point: topCurveControl4,
    },
  };

  // =========================================================
  // MEASUREMENT LABELS
  // =========================================================

  const labels = [
    // Total width
    {
      x: A.x + widthPx * 0.18,
      y: A.y + centerDipPx * 0.55,
      text: '12" Patti',
      fill: "#333",
      fontSize: 12,
    },

    // Left height
    {
      x: A.x - 35,
      y: A.y + leftHeightPx / 2,
      text: '3.5"',
      fill: "#333",
      fontSize: 11,
    },

    // Center dip
    {
      x: M.x + 8,
      y: M.y - 5,
      text: '2.5"',
      fill: "#333",
      fontSize: 11,
    },

    // Right height
    {
      x: D.x + 10,
      y: D.y + rightHeightPx / 2,
      text: '3.5"',
      fill: "#333",
      fontSize: 11,
    },

    // Pattern title
    {
      x: offsetX,
      y: offsetY - 20,
      text: 'Front Neck Patti',
      fill: "#333",
      fontSize: 14,
    },
  ];

  // =========================================================
  // HEIGHT
  // =========================================================

  const height = Math.max(
    leftHeightPx,
    rightHeightPx,
    centerDipPx
  );

  // =========================================================
  // RETURN PATTERN
  // =========================================================

  return {
    // =======================================================
    // BASIC INFORMATION
    // =======================================================

    type: "front-neck-patti",

    title: "Front Neck Patti",

    chest,

    // =======================================================
    // MAIN PATH
    // =======================================================

    path,

     pathStyle: {
        strokeWidth: .5,      // <--- Adjust this value (e.g., 0.5, 1, 1.5)
        stroke: "#2E7D32",   // Optional: force a specific green
        fill: "none",
    },
    // =======================================================
    // GUIDES
    // =======================================================

    guides,

    // =======================================================
    // MAIN POINTS
    // =======================================================

    points: {
      A,
      M,
      D,
      B,
      C,
    },

    // =======================================================
    // POINT LABELS
    // =======================================================

    pointLabels,

    // =======================================================
    // NAMED POINTERS
    // =======================================================

    pointers,

    // =======================================================
    // POINT STYLES
    // =======================================================

    pointStyles,

    // =======================================================
    // CONTROL POINTS
    // =======================================================

    controlPoints,

    // =======================================================
    // CONTROL POINT POINTERS
    // =======================================================

    controlPointPointers,

    // =======================================================
    // MEASUREMENT LABELS
    // =======================================================

    labels,

    // =======================================================
    // POSITION
    // =======================================================

    x: offsetX,

    y: offsetY,

    // =======================================================
    // SIZE
    // =======================================================

    width: widthPx,

    height,

    // =======================================================
    // BOUNDS
    // =======================================================

    bounds: {
      x: offsetX,
      y: offsetY,
      width: widthPx,
      height,
    },

    // =======================================================
    // ORIGINAL MEASUREMENTS
    // =======================================================

    measurements: {
      chest,
      totalWidth,
      leftHeight,
      centerDip,
      rightHeight,
    },

    // =======================================================
    // CALCULATIONS
    // =======================================================

    calculations: {
      scale,

      widthPx,

      leftHeightPx,

      centerDipPx,

      rightHeightPx,

      // Center position in inches
      centerWidth: totalWidth / 2,

      // Center position in SVG units
      centerWidthPx: widthPx / 2,
    },
  };
};

// =========================================================
// DEFAULT EXPORT
// =========================================================

export default generateFrontNeckPattiPattern;