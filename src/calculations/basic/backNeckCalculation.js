export const generateBackNeckPattern = (
  measurements = {},
  offsetX = 0,
  offsetY = 0,
  scale = 25.4
) => {
  const {
    hip,
    armhole,
    backLength,
    chest,
    backNeckDesignLength,
    shoulder,
    pakkaKazhuthu,
  } = measurements;

  // =========================================================
  // CONSTANTS – adjust these to match your reference image
  // =========================================================

  const SHOULDER_EXTRA = 0.75;       // Shoulder + 3/4"
  const NECK_TOP_EXTRA = 0.5;        // 0.5" above Back Length
  const NECK_BOTTOM_EXTRA = 0.5;       // 1" below Back Length

  const P6_EASE = 0.5;
  const P7_EXTENSION = 2;
  const P8_EXTENSION = 2;

  const STRAIGHT_OFFSET = 2;

  const VERTICAL_INFLUENCE_FACTOR = 0.5;

  // Armhole curve shape
  const ARMHOLE_DX_RATIO = 0.45;
  const ARMHOLE_DY_RATIO = 1.1;

  // =========================================================
  // CUBIC BEZIER POINT
  // =========================================================

  const cubicBezierPoint = (p0, c1, c2, p1, t) => {
    const mt = 1 - t;

    const x =
      mt * mt * mt * p0.x +
      3 * mt * mt * t * c1.x +
      3 * mt * t * t * c2.x +
      t * t * t * p1.x;

    const y =
      mt * mt * mt * p0.y +
      3 * mt * mt * t * c1.y +
      3 * mt * t * t * c2.y +
      t * t * t * p1.y;

    return { x, y };
  };

  // =========================================================
  // CUBIC BEZIER LENGTH
  // =========================================================

  const cubicBezierLength = (
    p0,
    c1,
    c2,
    p1,
    samples = 60
  ) => {
    let length = 0;
    let prev = p0;

    for (let i = 1; i <= samples; i++) {
      const t = i / samples;

      const pt = cubicBezierPoint(
        p0,
        c1,
        c2,
        p1,
        t
      );

      length += Math.hypot(
        pt.x - prev.x,
        pt.y - prev.y
      );

      prev = pt;
    }

    return length;
  };

  // =========================================================
  // SMOOTH CURVE (Catmull-Rom → Cubic Bezier)
  // =========================================================

  const createSmoothCurve = (points) => {
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const c1 = {
        x: p1.x + (p2.x - p0.x) / 6,
        y: p1.y + (p2.y - p0.y) / 6,
      };

      const c2 = {
        x: p2.x - (p3.x - p1.x) / 6,
        y: p2.y - (p3.y - p1.y) / 6,
      };

      d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
    }

    return d;
  };

  // =========================================================
// SMOOTH CURVE THROUGH POINTS WITH CONTROLLED TANGENTS
// =========================================================

const buildSmoothSegments = (points, fixedTangents = {}, tension = 1 / 3) => {
  const normalize = (v) => {
    const len = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / len, y: v.y / len };
  };

  // Tangent direction at each point
  const tangents = points.map((pt, i) => {
    if (fixedTangents[i]) return normalize(fixedTangents[i]);

    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    return normalize({ x: next.x - prev.x, y: next.y - prev.y });
  });

  // Each segment's handles are scaled by that segment's own length
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);

    segments.push({
      p0,
      p1,
      c1: {
        x: p0.x + tangents[i].x * segLen * tension,
        y: p0.y + tangents[i].y * segLen * tension,
      },
      c2: {
        x: p1.x - tangents[i + 1].x * segLen * tension,
        y: p1.y - tangents[i + 1].y * segLen * tension,
      },
    });
  }
  return segments;
};

const segmentsToPath = (segments) => {
  let d = `M ${segments[0].p0.x} ${segments[0].p0.y}`;
  segments.forEach((s) => {
    d += ` C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.p1.x} ${s.p1.y}`;
  });
  return d;
};

const segmentsToReversePath = (segments) => {
  const last = segments[segments.length - 1];
  let d = `M ${last.p1.x} ${last.p1.y}`;
  for (let i = segments.length - 1; i >= 0; i--) {
    const s = segments[i];
    d += ` C ${s.c2.x} ${s.c2.y}, ${s.c1.x} ${s.c1.y}, ${s.p0.x} ${s.p0.y}`;
  }
  return d;
};

  // =========================================================
  // SOLVE CURVE BY ARC LENGTH
  // =========================================================

  const solveCurveByArcLength = ({
    start,
    dxRatio,
    dyRatio,
    verticalOffsetPx = 0,
    targetLengthPx,
    toPxFn,
  }) => {
    const buildCurve = (sInches) => {
      const dxPx = toPxFn(
        sInches * dxRatio
      );

      const curveDyPx = toPxFn(
        sInches * dyRatio
      );

      const dyPx =
        verticalOffsetPx + curveDyPx;

      const end = {
        x: start.x + dxPx,
        y: start.y + dyPx,
      };

      const control1 = {
        x: start.x + dxPx * 0.1,
        y: start.y + dyPx * 0.6,
      };

      const control2 = {
        x: end.x - dxPx * 0.6,
        y: end.y - dyPx * 0.1,
      };

      return {
        end,
        control1,
        control2,
      };
    };

    let low = 0;

    let high =
      targetLengthPx / scale + 5;

    let result = buildCurve(high);

    for (let iter = 0; iter < 40; iter++) {
      const mid =
        (low + high) / 2;

      const curve =
        buildCurve(mid);

      const length =
        cubicBezierLength(
          start,
          curve.control1,
          curve.control2,
          curve.end
        );

      if (length < targetLengthPx) {
        low = mid;
      } else {
        high = mid;
      }

      result = curve;
    }

    return result;
  };

  // =========================================================
  // COLORS
  // =========================================================

  const COLORS = {
    // POINT COLORS
    A: "#000000",

    P1: "#1565C0",
    P2: "#2E7D32",
    P3: "#D32F2F",
    P4: "#7B1FA2",
    D: "#F57C00",
    P6: "#00838F",
    P7: "#C2185B",
    P8: "#6D4C41",
    S: "#E91E63",

    // POINTER / MEASUREMENT COLORS
    A_P1: "#1565C0",
    P1_P2: "#2E7D32",

    P2_P3_CHEST: "#D32F2F",
    P2_P3_ARMHOLE: "#E65100",

    A_P4: "#7B1FA2",
    P1_P4: "#8E24AA",

    A_D: "#F57C00",

    D_P6: "#00838F",
    P6_P7: "#C2185B",

    P3_P8: "#6D4C41",
    P8_P7: "#5D4037",

    P3_P6: "#757575",

    label: "#212121",
  };

  // =========================================================
  // CHECK MEASUREMENTS
  // =========================================================

  const requiredMeasurements = [
    hip,
    armhole,
    backLength,
    chest,
    backNeckDesignLength,
    shoulder,
    pakkaKazhuthu,
  ];

  const hasInvalidMeasurement =
    requiredMeasurements.some(
      (value) =>
        value === "" ||
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    );

  if (hasInvalidMeasurement) {
    return null;
  }

  // =========================================================
  // CONVERT TO NUMBERS
  // =========================================================

  const hipNum = Number(hip);
  const armholeNum = Number(armhole);
  const backLengthNum = Number(backLength);
  const chestNum = Number(chest);
  const backNeckDesignLengthNum =
    Number(backNeckDesignLength);
  const shoulderNum = Number(shoulder);
  const pakkaKazhuthuNum =
    Number(pakkaKazhuthu);

  // =========================================================
  // INCHES → PIXELS
  // =========================================================

  const toPx = (value) =>
    Number(value) * scale;

  // =========================================================
  // A
  // =========================================================

  const A = {
    x: offsetX,
    y: offsetY,
  };

  // =========================================================
  // P1
  // =========================================================

  const p1Distance =
    pakkaKazhuthuNum / 2;

  const P1 = {
    x:
      A.x +
      toPx(p1Distance),

    y: A.y,
  };

  // =========================================================
  // P2
  // =========================================================

  const p1ToP2 =
    shoulderNum +
    SHOULDER_EXTRA;

  const P2 = {
    x:
      P1.x +
      toPx(p1ToP2),

    y: A.y,
  };

  // =========================================================
  // SHOULDER EASE REFERENCE POINT
  // =========================================================

  const SE = {
    x:
      P1.x +
      toPx(shoulderNum),

    y: P1.y,
  };

  // =========================================================
  // B
  // =========================================================

  const B = {
    x: A.x,
    y:
      A.y +
      toPx(NECK_TOP_EXTRA),
  };

  const P4 = {
    x: A.x,
    y:
      B.y +
      toPx(
        backNeckDesignLengthNum
      ),
  };

  // =========================================================
  // P2_EASE_POINT
  // =========================================================

  const P2_EASE_POINT = {
    x: P2.x,
    y: B.y,
  };

  // =========================================================
  // VERTICAL DEPTH TRIAL REFERENCES
  // =========================================================

  const verticalTrialDepths = [
    5,
    5.5,
    6,
    6.5,
    7,
  ];

  const verticalTrialPoints =
    verticalTrialDepths.map(
      (depth, index) => ({
        [`DEPTH_${String(depth).replace(".", "_")}`]: {
          x: P2_EASE_POINT.x,
          y:
            P2_EASE_POINT.y +
            toPx(depth),
        },
      })
    ).reduce(
      (acc, item) => ({
        ...acc,
        ...item,
      }),
      {}
    );

  // =========================================================
  // P3 – ARMHOLE CURVE
  // =========================================================
// =========================================================
// ARMHOLE: SOLVE P3 DEPTH SO THAT CURVE E → A2 → P3 = ARMHOLE / 2
// =========================================================


const E = P2_EASE_POINT;

const ARM_E_HANDLE = 0.6;   // how long the vertical handle at E is (0.4 – 0.8)
const ARM_A2_HANDLE = 0.5;  // handle length at A2 (0.3 – 0.7)
const ARM_P3_HANDLE = 0.5;  // how much the curve flattens into P3 (0.3 – 0.7)


const armholeTargetPx = toPx(armholeNum / 2);
const targetP3X = A.x + toPx(chestNum / 4);

const A2_DISTANCE = chestNum / 25;
const diagonalOffset = toPx(A2_DISTANCE) / Math.sqrt(2);

// Build the full armhole shape for a given depth (inches below E)
const buildArmhole = (depthInches) => {
  const P3 = {
    x: targetP3X,
    y: E.y + toPx(depthInches),
  };

  const A1 = { x: E.x, y: P3.y };

  const A2 = {
    x: A1.x + diagonalOffset,
    y: A1.y - diagonalOffset,
  };

  // Segment 1: E → A2 (leaves E straight down)
  const seg1 = {
    p0: E,
    p1: A2,
    c1: { x: E.x, y: E.y + (A2.y - E.y) * ARM_E_HANDLE },
    c2: {
      x: A2.x - diagonalOffset * ARM_A2_HANDLE,
      y: A2.y - diagonalOffset * ARM_A2_HANDLE,
    },
  };

  // Segment 2: A2 → P3 (mirrored handle at A2, flat into P3)
  const seg2 = {
    p0: A2,
    p1: P3,
    c1: {
      x: A2.x + diagonalOffset * ARM_A2_HANDLE,
      y: A2.y + diagonalOffset * ARM_A2_HANDLE,
    },
    c2: {
      x: P3.x - (P3.x - A2.x) * ARM_P3_HANDLE,
      y: P3.y,
    },
  };

  const length =
    cubicBezierLength(seg1.p0, seg1.c1, seg1.c2, seg1.p1) +
    cubicBezierLength(seg2.p0, seg2.c1, seg2.c2, seg2.p1);

  return { P3, A1, A2, seg1, seg2, length, depth: depthInches };
};

const solveArmholeByChestAndDepth = () => {
  let low = (diagonalOffset / scale) + 0.1; // A2 must stay below E
  let high = 20;

  let best = buildArmhole(high);

  for (let iter = 0; iter < 60; iter++) {
    const mid = (low + high) / 2;
    const candidate = buildArmhole(mid);

    best = candidate;

    if (candidate.length < armholeTargetPx) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return best;
};

const armholeSolved = solveArmholeByChestAndDepth();

const P3 = armholeSolved.P3;
const A1 = armholeSolved.A1;
const A2 = armholeSolved.A2;

// Keep the old names used further down in your file
const p2ToP3Solved = {
  end: P3,
  control1: armholeSolved.seg1.c1,
  control2: armholeSolved.seg1.c2,
  depth: armholeSolved.depth,
  horizontal: (P3.x - A.x) / scale,
};



  const angleBisectorDistance =
    toPx(A2_DISTANCE);


  // =========================================================
  // CHEST / 4 REFERENCE
  // =========================================================

  const CHEST_P3_REFERENCE = {
    x: P3.x,
    y: P3.y,
  };
  const CHEST_P3_START = {
    x: A.x,
    y: P3.y,
  };
  const p2ToP3Control1 =
    p2ToP3Solved.control1;

  const p2ToP3Control2 =
    p2ToP3Solved.control2;

  const p2ToP3Horizontal =
    p2ToP3Solved.horizontal;

  const p2ToP3Vertical =
    p2ToP3Solved.depth;

  const p2ToP3Curve = `
    M ${P2_EASE_POINT.x} ${P2_EASE_POINT.y}
    C
      ${p2ToP3Control1.x} ${p2ToP3Control1.y},
      ${p2ToP3Control2.x} ${p2ToP3Control2.y},
      ${P3.x} ${P3.y}
  `;

  // =========================================================
  // S – BACK NECK STRAIGHT DROP END
  // =========================================================

  const straightLength =
    backNeckDesignLengthNum -
    STRAIGHT_OFFSET;

  const S = {
    x: P1.x,
    y:
      P1.y +
      toPx(straightLength),
  };

  // =========================================================
  // D
  // =========================================================

  const totalNeckHeight =
    NECK_TOP_EXTRA +
    backLengthNum +
    NECK_BOTTOM_EXTRA;

  const D = {
    x: A.x,
    y:
      A.y + toPx(totalNeckHeight),
  };

  // =========================================================
  // C
  // =========================================================

  const C = {
    x: A.x,

    y:
      B.y +
      toPx(backLengthNum),
  };

  // =========================================================
  // P6
  // =========================================================

  const dToP6 =
    hipNum / 4 +
    P6_EASE;

  const P6 = {
    x:
      D.x +
      toPx(dToP6),

    y: D.y,
  };

  // =========================================================
  // P7
  // =========================================================

  const P7 = {
    x:
      P6.x +
      toPx(P7_EXTENSION),

    y: P6.y,
  };

  // =========================================================
  // P8
  // =========================================================

  const P8 = {
    x:
      P3.x +
      toPx(P8_EXTENSION),

    y: P3.y,
  };

  // =========================================================
  // ARMHOLE CURVE
  // E → A2 → P3 → P8
  // =========================================================

  const armholeCurve = createSmoothCurve([
    E,
    A2,
    P3,
    P8,
  ]);

  const reverseArmholeCurve = createSmoothCurve([
    P8,
    P3,
    A2,
    E,
  ]);

  // =========================================================
  // P1 → S
  // =========================================================

  const p1ToS = `
      M ${P1.x} ${P1.y}
      L ${S.x} ${S.y}
    `;

  // =========================================================
  // BACK NECK CURVE
  // =========================================================

  const horizontalInfluence =
    0.375 *
    pakkaKazhuthuNum;

  const verticalInfluence =
    (P4.y - S.y) *
    VERTICAL_INFLUENCE_FACTOR;

  const backNeckControl1 = {
    x: S.x,
    y:
      S.y +
      verticalInfluence,
  };

  const backNeckControl2 = {
    x:
      P4.x +
      toPx(horizontalInfluence),

    y: P4.y,
  };

  const backNeckCurve = `
      M ${S.x} ${S.y}
      C
        ${backNeckControl1.x} ${backNeckControl1.y},
        ${backNeckControl2.x} ${backNeckControl2.y},
        ${P4.x} ${P4.y}
    `;

  // =========================================================
  // 45% POINT FROM E → A1
  // =========================================================

  const E_TO_A1_CURVE_START_RATIO = 0.45;

  const E_A1_45 = {
    x:
      E.x +
      (A1.x - E.x) *
        E_TO_A1_CURVE_START_RATIO,

    y:
      E.y +
      (A1.y - E.y) *
        E_TO_A1_CURVE_START_RATIO,
  };

  // =========================================================
  // 75% POINT FROM A1 → P3
  // =========================================================

  const A1_TO_P3_CURVE_END_RATIO = 0.75;

  const ARMHOLE_75_POINT = {
    x:
      A1.x +
      (P3.x - A1.x) *
        A1_TO_P3_CURVE_END_RATIO,

    y:
      A1.y +
      (P3.y - A1.y) *
        A1_TO_P3_CURVE_END_RATIO,
  };



// =========================================================
// ARMHOLE: ONE SMOOTH CURVE  E → A2 → P3
// =========================================================
// Tangent at E  : straight down   (0, 1)
// Tangent at A2 : (1, 1)          (perpendicular to the A1–A2 bisector)
// Tangent at P3 : straight right  (1, 0)
// =========================================================


const a2Offset = diagonalOffset; // A2.x - A1.x  (= A1.y - A2.y)

// Segment 1: E → A2
const armSeg1 = {
  p0: E,
  p1: A2,
  c1: {
    x: E.x,
    y: E.y + (A2.y - E.y) * ARM_E_HANDLE,
  },
  c2: {
    x: A2.x - a2Offset * ARM_A2_HANDLE,
    y: A2.y - a2Offset * ARM_A2_HANDLE,
  },
};

// Segment 2: A2 → P3 (handle at A2 is the exact mirror of seg 1 → smooth join)
const armSeg2 = {
  p0: A2,
  p1: P3,
  c1: {
    x: A2.x + a2Offset * ARM_A2_HANDLE,
    y: A2.y + a2Offset * ARM_A2_HANDLE,
  },
  c2: {
    x: P3.x - (P3.x - A2.x) * ARM_P3_HANDLE,
    y: P3.y,
  },
};

const armholeSegments = [armholeSolved.seg1, armholeSolved.seg2];

// Forward: E → A2 → P3 → P8
const smoothArmholeCurve =
  segmentsToPath(armholeSegments) + ` L ${P8.x} ${P8.y}`;

// Reverse: P8 → P3 → A2 → E
const smoothArmholeCurveReverse =
  `M ${P8.x} ${P8.y} L ${P3.x} ${P3.y}` +
  segmentsToReversePath(armholeSegments).replace(/^M [^C]*/, " ");

  // =========================================================
  // E → 45% POINT
  // =========================================================

  const eTo45Control1 = {
    x: E.x,
    y:
      E.y +
      (E_A1_45.y - E.y) * 0.60,
  };

  const eTo45Control2 = {
    x:
      E_A1_45.x -
      toPx(0.15),

    y:
      E_A1_45.y -
      toPx(0.10),
  };

  // ---------------------------------------------------------
  // 45% → A2
  // ---------------------------------------------------------

  const point45ToA2Control1 = {
    x:
      E_A1_45.x +
      toPx(0.15),

    y:
      E_A1_45.y +
      toPx(0.05),
  };

  const point45ToA2Control2 = {
    x:
      A2.x -
      toPx(0.20),

    y:
      A2.y -
      toPx(0.10),
  };

  // ---------------------------------------------------------
  // A2 → A1
  // ---------------------------------------------------------

  const a2ToA1Control1 = {
    x:
      A2.x +
      toPx(0.20),

    y:
      A2.y +
      toPx(0.05),
  };

  const a2ToA1Control2 = {
    x:
      A1.x +
      toPx(0.15),

    y:
      A1.y -
      toPx(0.10),
  };

  // ---------------------------------------------------------
  // A1 → P3
  // ---------------------------------------------------------

  const a1ToP3Control1 = {
    x:
      A1.x +
      toPx(0.40),

    y:
      A1.y,
  };

  const a1ToP3Control2 = {
    x:
      P3.x -
      toPx(0.50),

    y:
      P3.y -
      toPx(0.02),
  };

  // =========================================================
  // COMPLETE ARMHOLE CURVE
  // E → E_A1_45 → A2 → A1 → P3
  // =========================================================

  const eA2A1P3Curve = `
  M ${E.x} ${E.y}

  C
    ${eTo45Control1.x} ${eTo45Control1.y},
    ${eTo45Control2.x} ${eTo45Control2.y},
    ${E_A1_45.x} ${E_A1_45.y}

  C
    ${point45ToA2Control1.x} ${point45ToA2Control1.y},
    ${point45ToA2Control2.x} ${point45ToA2Control2.y},
    ${A2.x} ${A2.y}

  C
    ${a2ToA1Control1.x} ${a2ToA1Control1.y},
    ${a2ToA1Control2.x} ${a2ToA1Control2.y},
    ${A1.x} ${A1.y}

  C
    ${a1ToP3Control1.x} ${a1ToP3Control1.y},
    ${a1ToP3Control2.x} ${a1ToP3Control2.y},
    ${P3.x} ${P3.y}
`;

  // =========================================================
  // PATTERN BOUNDARY
  // =========================================================

  const path = `
  M ${P1.x} ${P1.y}

  L ${S.x} ${S.y}

  C
    ${backNeckControl1.x} ${backNeckControl1.y},
    ${backNeckControl2.x} ${backNeckControl2.y},
    ${P4.x} ${P4.y}

  L ${D.x} ${D.y}

  L ${P6.x} ${P6.y}

  L ${P7.x} ${P7.y}

   L ${P8.x} ${P8.y}

  ${smoothArmholeCurveReverse.replace(/^M /, "L ")}

  L ${P2.x} ${P2.y}

  L ${P1.x} ${P1.y}

  Z
`.trim();

  // =========================================================
  // GUIDES
  // =========================================================

  const guides = {

    // A → P1
    A_to_P1: `
        M ${A.x} ${A.y}
        L ${P1.x} ${P1.y}
      `,

    // P1 → P2
    P1_to_P2: `
        M ${P1.x} ${P1.y}
        L ${P2.x} ${P2.y}
      `,



    // A → P4
    A_to_P4: `
        M ${A.x} ${A.y}
        L ${P4.x} ${P4.y}
      `,

    // P1 → S → P4
    P1_to_P4: `
        M ${P1.x} ${P1.y}
        L ${S.x} ${S.y}
        L ${P4.x} ${P4.y}
      `,

    // A → D
    A_to_D: `
        M ${A.x} ${A.y}
        L ${D.x} ${D.y}
      `,

    // D → P6
    D_to_P6: `
        M ${D.x} ${D.y}
        L ${P6.x} ${P6.y}
      `,

    // P6 → P7
    P6_to_P7: `
        M ${P6.x} ${P6.y}
        L ${P7.x} ${P7.y}
      `,

    // P3 → P8
    P3_to_P8: `
  M ${P3.x} ${P3.y}
  L ${P8.x} ${P8.y}
`,

    // P8 → P7
    P8_to_P7: `
        M ${P8.x} ${P8.y}
        L ${P7.x} ${P7.y}
      `,

    // P3 → P6
    P3_to_P6: `
        M ${P3.x} ${P3.y}
        L ${P6.x} ${P6.y}
      `,

    // A → B
    A_to_B: `
        M ${A.x} ${A.y}
        L ${B.x} ${B.y}
      `,

    // C → D
    C_to_D: `
        M ${C.x} ${C.y}
        L ${D.x} ${D.y}
      `,

    // B → P2
    B_to_P2_EASE: `
        M ${B.x} ${B.y}
        L ${P2.x} ${B.y}
      `,

    // C → P7
    C_to_P7_EASE: `
        M ${C.x} ${C.y}
        L ${P7.x} ${C.y}
      `,

    // D → P7
    D_to_P7_EASE: `
        M ${D.x} ${D.y}
        L ${P7.x} ${D.y}
      `,

    // P2 → 0.5" vertical ease point
    P2_to_EASE_POINT: `
        M ${P2.x} ${P2.y}
        L ${P2_EASE_POINT.x} ${P2_EASE_POINT.y}
      `,

    Chest_to_P3: `
  M ${CHEST_P3_START.x} ${CHEST_P3_START.y}
  L ${CHEST_P3_REFERENCE.x} ${CHEST_P3_REFERENCE.y}

`,

    E_to_P3_Depth: `
  M ${P2_EASE_POINT.x} ${P2_EASE_POINT.y}
  L ${P2_EASE_POINT.x} ${P3.y}
`,
  };

  // =========================================================
  // POINTER DEFINITIONS
  // =========================================================

  const pointers = [

    {
      id: "A_TO_P1",
      from: "A",
      to: "P1",
      measurement: p1Distance,
      measurementName:
        "Pakka Kazhuthu / 2",
      color: COLORS.A_P1,
      type: "line",
    },

    {
      id: "P1_TO_P2",
      from: "P1",
      to: "P2",
      measurement: p1ToP2,
      measurementName:
        "Shoulder + 0.75",
      color: COLORS.P1_P2,
      type: "line",
    },

    {
      id: "P2_TO_P3_ARMHOLE",
      from: "P2_EASE_POINT",
      to: "P3",
      measurement: armholeNum / 2,
      measurementName: "Armhole / 2 (curve length)",
      color: COLORS.P2_P3_ARMHOLE,
      type: "curve",

      referenceFrom: "B",
      referenceTo: "P2",
      referenceGuide: "B_to_P2_EASE",
      referenceStyle: "dotted",
    },

    {
      id: "P1_TO_S",
      from: "P1",
      to: "S",
      measurement:
        straightLength,
      measurementName:
        `Straight drop (Design Neck - ${STRAIGHT_OFFSET}")`,
      color:
        COLORS.P1_P4,
      type: "vertical",
    },

    {
      id: "S_TO_P4",
      from: "S",
      to: "P4",
      measurement:
        backNeckDesignLengthNum -
        straightLength,
      measurementName:
        "Back neck curve",
      color:
        COLORS.P1_P4,
      type: "curve",
    },

    {
      id: "A_TO_P4",
      from: "A",
      to: "P4",
      measurement:
        backNeckDesignLengthNum,
      measurementName:
        "Design Neck Length",
      color:
        COLORS.A_P4,
      type: "vertical",
    },

    {
      id: "A_TO_D",
      from: "A",
      to: "D",
      measurement:
        totalNeckHeight,
      measurementName:
        "Total Neck Height",
      color:
        COLORS.A_D,
      type: "vertical",
    },

    {
      id: "D_TO_P6",
      from: "D",
      to: "P6",
      measurement:
        dToP6,
      measurementName:
        "Bottom Width",
      color:
        COLORS.D_P6,
      type: "horizontal",
    },

    {
      id: "P6_TO_P7",
      from: "P6",
      to: "P7",
      measurement:
        P7_EXTENSION,
      measurementName:
        "Bottom Extension",
      color:
        COLORS.P6_P7,
      type: "horizontal",
    },

    {
      id: "P3_TO_P8",
      from: "P3",
      to: "P8",
      measurement:
        P8_EXTENSION,
      measurementName:
        "Curve Extension",
      color:
        COLORS.P3_P8,
      type: "line",
    },

    {
      id: "P8_TO_P7",
      from: "P8",
      to: "P7",
      measurement: null,
      measurementName:
        "Side Connection",
      color:
        COLORS.P8_P7,
      type: "line",
    },

    {
      id: "P3_TO_P6",
      from: "P3",
      to: "P6",
      measurement: null,
      measurementName:
        "Construction Line",
      color:
        COLORS.P3_P6,
      type: "construction",
    },
    {
      id: "P2_VERTICAL_EASE",
      from: "P2",
      to: "P2_EASE_POINT",
      measurement: NECK_TOP_EXTRA,
      measurementName: "Vertical Ease",
      color: COLORS.A_D,
      type: "vertical",
    },
    {
      id: "E_TO_P3_DEPTH",
      from: "P2_EASE_POINT",
      to: "CHEST_P3_START",
      measurement: p2ToP3Vertical,
      measurementName: `Armhole Depth ${p2ToP3Vertical.toFixed(2)}"`,
      color: COLORS.P2_P3_ARMHOLE,
      type: "vertical",
    },
    {
      id: "P2_TO_DEPTH_5",
      from: "P2_EASE_POINT",
      to: "DEPTH_5",
      measurement: 5,
      measurementName: "Armhole Depth Trial - 5",
      color: COLORS.P2_P3_ARMHOLE,
      type: "vertical",
    },

    {
      id: "P2_TO_DEPTH_5_5",
      from: "P2_EASE_POINT",
      to: "DEPTH_5_5",
      measurement: 5.5,
      measurementName: "Armhole Depth Trial - 5.5",
      color: COLORS.P2_P3_ARMHOLE,
      type: "vertical",
    },

    {
      id: "P2_TO_DEPTH_6",
      from: "P2_EASE_POINT",
      to: "DEPTH_6",
      measurement: 6,
      measurementName: "Armhole Depth Trial - 6",
      color: COLORS.P2_P3_ARMHOLE,
      type: "vertical",
    },

    {
      id: "P2_TO_DEPTH_6_5",
      from: "P2_EASE_POINT",
      to: "DEPTH_6_5",
      measurement: 6.5,
      measurementName: "Armhole Depth Trial - 6.5",
      color: COLORS.P2_P3_ARMHOLE,
      type: "vertical",
    },

    {
      id: "P2_TO_DEPTH_7",
      from: "P2_EASE_POINT",
      to: "DEPTH_7",
      measurement: 7,
      measurementName: "Armhole Depth Trial - 7",
      color: COLORS.P2_P3_ARMHOLE,
      type: "vertical",
    },
    {
      id: "CHEST_TO_P3",
      from: "CHEST_P3_START",
      to: "CHEST_P3_REFERENCE",
      measurement: chestNum / 4,
      measurementName: "Chest / 4",
      color: COLORS.P2_P3_CHEST,
      type: "horizontal",
    },

  ];

  // =========================================================
  // POINT STYLES
  // =========================================================

  const pointStyles = {
    A: {
      color: COLORS.A,
      radius:2,
    },

    P1: {
      color: COLORS.P1,
      radius:2,
    },

    P2: {
      color: COLORS.P2,
      radius:2,
    },

    P3: {
      color: COLORS.P3,
      radius:2,
    },

    P4: {
      color: COLORS.P4,
      radius:2,
    },

    D: {
      color: COLORS.D,
      radius:2,
    },

    P6: {
      color: COLORS.P6,
      radius:2,
    },

    P7: {
      color: COLORS.P7,
      radius:2,
    },

    P8: {
      color: COLORS.P8,
      radius:2,
    },

    S: {
      color: COLORS.S,
      radius:2,
    },
    P2_EASE_POINT: {
      color: COLORS.A_D,
      radius:2,
    },
    A1: {
      color: "#16A34A",
      radius:2,
    },

    A2: {
      color: "#F59E0B",
      radius:2,
    },

    // NEW ARMHOLE CURVE REFERENCES
    E_A1_45: {
      color: "#0EA5E9",
      radius:2,
    },

    ARMHOLE_75_POINT: {
      color: "#8B5CF6",
      radius:2,
    },
  };

  // =========================================================
  // POINT LABELS
  // =========================================================

  const pointLabels = {
    A: {
      text: "A",
      color: COLORS.A,
    },

    P1: {
      text: "P1",
      color: COLORS.P1,
    },

    P2: {
      text: "P2",
      color: COLORS.P2,
    },

    P3: {
      text: "P3",
      color: COLORS.P3,
    },

    P4: {
      text: "P4",
      color: COLORS.P4,
    },

    D: {
      text: "D",
      color: COLORS.D,
    },

    P6: {
      text: "P6",
      color: COLORS.P6,
    },

    P7: {
      text: "P7",
      color: COLORS.P7,
    },

    P8: {
      text: "P8",
      color: COLORS.P8,
    },

    S: {
      text: "S",
      color: COLORS.S,
    },
    P2_EASE_POINT: {
      text: "E",
      color: COLORS.A_D,
    },
    A1: {
      text: "A1",
      color: "#16A34A",
    },

    A2: {
      text: "A2",
      color: "#F59E0B",
    },

    // NEW ARMHOLE CURVE REFERENCES
    E_A1_45: {
      text: "45%",
      color: "#0EA5E9",
    },

    ARMHOLE_75_POINT: {
      text: "75%",
      color: "#8B5CF6",
    },
  };

  // =========================================================
  // GUIDE COLORS
  // =========================================================

  const guideColors = {

    A_to_P1:
      COLORS.A_P1,

    P1_to_P2:
      COLORS.P1_P2,

    P2_to_P3:
      COLORS.P2_P3_CHEST,

    A_to_P4:
      COLORS.A_P4,

    P1_to_P4:
      COLORS.P1_P4,

    A_to_D:
      COLORS.A_D,

    D_to_P6:
      COLORS.D_P6,

    P6_to_P7:
      COLORS.P6_P7,

    P3_to_P8:
      COLORS.P3_P8,

    P8_to_P7:
      COLORS.P8_P7,

    P3_to_P6:
      COLORS.P3_P6,

    A_to_B:
      COLORS.A_D,

    C_to_D:
      COLORS.A_D,

    B_to_P2_EASE:
      COLORS.A_D,

    C_to_P7_EASE:
      COLORS.A_D,

    D_to_P7_EASE:
      COLORS.A_D,
    Chest_to_P3:
      COLORS.P2_P3_CHEST,

  
  };

  // =========================================================
  // LABELS
  // =========================================================

  const labels = [

    {
      id: "LABEL_A_P1",
      text: `${p1Distance}" P K`,
      x:
        (A.x + P1.x) / 2,
      y:
        A.y - 14,
      color:
        COLORS.A_P1,
    },

    {
      id: "LABEL_P1_P2",
      text: `${p1ToP2}" Shoul`,
      x:
        (P1.x + P2.x) / 2,
      y:
        P1.y - 14,
      color:
        COLORS.P1_P2,
    },

    
    {
      id: "LABEL_A_P4",
      text:
        `${backNeckDesignLengthNum}" Design Neck Length`,
      x:
        P4.x - 25,
      y:
        (A.y + P4.y) / 2,
      color:
        COLORS.A_P4,
    },

    {
      id: "LABEL_P1_S",
      x:
        P1.x + 20,
      y:
        (P1.y + S.y) / 2,
      color:
        COLORS.P1_P4,
    },

    {
      id: "LABEL_S_P4",
      text: "",
      x:
        (S.x + P4.x) / 2 + 20,
      y:
        (S.y + P4.y) / 2 - 10,
      color:
        COLORS.P1_P4,
    },

    {
      id: "LABEL_A_D",
      text:
        `${totalNeckHeight}" Total Neck Height`,
      x:
        A.x - 25,
      y:
        (A.y + D.y) / 2,
      color:
        COLORS.A_D,
    },

    {
      id: "LABEL_D_P6",
      text:
        `${dToP6}" Hip Width`,
      x:
        (D.x + P6.x) / 2,
      y:
        D.y + 25,
      color:
        COLORS.D_P6,
    },

    {
      id: "LABEL_P6_P7",
      text:
        `${P7_EXTENSION}"`,
      x:
        (P6.x + P7.x) / 2,
      y:
        P6.y + 25,
      color:
        COLORS.P6_P7,
    },

    {
      id: "LABEL_P3_P8",
      text:
        `${P8_EXTENSION}"`,
      x:
        (P3.x + P8.x) / 2,
      y:
        P8.y + 25,
      color:
        COLORS.P3_P8,
    },

    // A → B
    {
      id: "LABEL_A_B",
      text:
        `${NECK_TOP_EXTRA}"`,
      x:
        A.x - 35,
      y:
        (A.y + B.y) / 2,
      color:
        COLORS.A_D,
    },

    // C → D
    {
      id: "LABEL_C_D",
      text:
        `${NECK_BOTTOM_EXTRA}"`,
      x:
        A.x - 35,
      y:
        (C.y + D.y) / 2,
      color:
        COLORS.A_D,
    },

    // Shoulder ease
    {
      id: "LABEL_SHOULDER_EASE",
      x:
        SE.x + 10,
      y:
        SE.y + toPx(3),
      color:
        COLORS.P1_P2,
    },
  ];

  // =========================================================
  // RETURN
  // =========================================================

  return {

    // MAIN SHAPE
    path,

    // NEW: SMOOTH ARMHOLE CURVE
    smoothArmholeCurve,
    smoothArmholeCurveReverse,

    // OTHER ARMHOLE CURVE VARIANTS
    armholeCurve,
    reverseArmholeCurve,
    eA2A1P3Curve,
    p2ToP3Curve,

    // GUIDES
    guides,

    // GUIDE COLORS
    guideColors,

    // POINTERS
    pointers,

    // POINT STYLES
    pointStyles,

    // COLORS
    colors: COLORS,

    // POINT LABELS
    pointLabels,

    // POINT COORDINATES
    points: {
      A,
      B,
      C,
      E,
      A1,
      A2,

      // NEW ARMHOLE CURVE REFERENCES
      E_A1_45,
      ARMHOLE_75_POINT,

      P1,
      SE,
      P2,
      P2_EASE_POINT,
      P3,
      P4,
      D,
      P6,
      P7,
      P8,
      S,
    },



    // LABELS
    labels,

    // POSITION
    x: offsetX,
    y: offsetY,

    // SIZE
    width:
      toPx(
        Math.max(
          P7.x - offsetX,
          P8.x - offsetX,
          P2.x - offsetX
        )
      ),

    height:
      toPx(totalNeckHeight),

    // ORIGINAL MEASUREMENTS
    measurements: {
      hip: hipNum,
      armhole: armholeNum,
      backLength: backLengthNum,
      chest: chestNum,
      backNeckDesignLength:
        backNeckDesignLengthNum,
      shoulder: shoulderNum,
      pakkaKazhuthu:
        pakkaKazhuthuNum,
    },

    // CALCULATIONS
    calculations: {

      shoulderExtra:
        SHOULDER_EXTRA,

      neckTopExtra:
        NECK_TOP_EXTRA,

      neckBottomExtra:
        NECK_BOTTOM_EXTRA,

      p1Distance,

      p1ToP2,

      // -----------------------------------------------------
      // ARMHOLE
      // -----------------------------------------------------

      armholeCurveTargetLength:
        armholeNum / 2,

      armholeReferenceOffset:
        NECK_TOP_EXTRA,

      armholeReference:
        "B_to_P2",

      p2ToP3Horizontal,

      p2ToP3Vertical,

      // -----------------------------------------------------
      // BOTTOM
      // -----------------------------------------------------

      p6Ease:
        P6_EASE,

      dToP6,

      p7Extension:
        P7_EXTENSION,

      p8Extension:
        P8_EXTENSION,

      // -----------------------------------------------------
      // HEIGHT
      // -----------------------------------------------------

      totalNeckHeight,

      // -----------------------------------------------------
      // BACK NECK
      // -----------------------------------------------------

      designNeckLength:
        backNeckDesignLengthNum,

      straightDrop:
        straightLength,

      backNeckHorizontalInfluence:
        0.375 *
        pakkaKazhuthuNum,

      backNeckVerticalInfluenceFactor:
        VERTICAL_INFLUENCE_FACTOR,
    },
  };
};