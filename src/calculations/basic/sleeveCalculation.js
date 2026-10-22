/**
 * Calculate how much to reduce the sleeve-cap curve.
 *
 * @param {number} capHeight - Sleeve cap height in inches
 * @param {number} reduction - Curve reduction in inches
 * @returns {number} factor between 0 and 1
 */
function getControlPointFactor(capHeight, reduction) {
  if (reduction === 0) {
    return 0;
  }

  const maxDeviation = 0.75 * capHeight;

  const targetDeviation = Math.max(
    0,
    maxDeviation - reduction
  );

  const factor =
    1 - targetDeviation / maxDeviation;

  return Math.max(
    0,
    Math.min(1, factor)
  );
}

export const generateSleevePattern = (
  measurements = {},
  offsetX = 0,
  offsetY = 0,
  scale = 25.4,
  capHeightOverride = null,
  extensionDrop = 0.5,
  curveReduction = 0
) => {
  const {
    sleeveHeight,
    lengthEase,
    sleeveRound,
    armhole,
    straightRun,
    underarmEase,
  } = measurements;

  // -----------------------------------------
  // Check incomplete measurements
  // -----------------------------------------

  const requiredMeasurements = [
    sleeveHeight,
    lengthEase,
    sleeveRound,
    armhole,
    straightRun,
    underarmEase,
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

  // Convert to numbers
  const sleeveHeightNum = Number(sleeveHeight);
  const lengthEaseNum = Number(lengthEase);
  const sleeveRoundNum = Number(sleeveRound);
  const armholeNum = Number(armhole);
  const straightRunNum = Number(straightRun);
  const underarmEaseNum = Number(underarmEase);

  const halfBicep = sleeveRoundNum / 2;
  const halfArmhole = armholeNum / 2;

  const totalLength =
    sleeveHeightNum + lengthEaseNum;

  const defaultCapHeight = 3;

  const capHeight =
    capHeightOverride !== null
      ? Number(capHeightOverride)
      : defaultCapHeight;

  // -----------------------------------------
  // Validate armhole / cap
  // -----------------------------------------

  const radiusSquared =
    halfArmhole * halfArmhole -
    capHeight * capHeight;

  if (
    !Number.isFinite(halfArmhole) ||
    halfArmhole <= 0 ||
    radiusSquared < 0
  ) {
    return null;
  }

  const dx = Math.sqrt(radiusSquared);

  const toPx = (value) =>
    Number(value) * scale;

  // -----------------------------------------
  // Points
  // -----------------------------------------

  const P1 = {
    x: offsetX,
    y: offsetY,
  };

  const P2 = {
    x: offsetX + toPx(straightRunNum),
    y: offsetY,
  };

  const A = {
    x: P2.x + toPx(dx),
    y: offsetY + toPx(capHeight),
  };

  const P7 = {
    x: A.x + toPx(underarmEaseNum),
    y: A.y + toPx(extensionDrop),
  };

  const P4 = {
    x: offsetX,
    y: offsetY + toPx(totalLength),
  };

  const P5 = {
    x: offsetX + toPx(halfBicep),
    y: offsetY + toPx(totalLength),
  };

  const P6 = {
    x:
      offsetX +
      toPx(halfBicep + underarmEaseNum),
    y: offsetY + toPx(totalLength),
  };
// -----------------------------------------
// Cap curve P2 → A → P7 (smooth, no corners)
// -----------------------------------------

const CAP_C1_X = 0.35;        // handle length leaving P2 (flat, matches P1 → P2 line)
const CAP_C2_X = 0.45;        // handle length arriving at A
const A_TO_P7_HANDLE = 0.4;   // handle length leaving A
const P7_HANDLE = 0.4;        // handle length arriving at P7

const w = A.x - P2.x;
const e = P7.x - A.x;

// Shared tangent direction at A (points from A toward P7)
const tLen = Math.hypot(P7.x - A.x, P7.y - A.y) || 1;
const tA = {
  x: (P7.x - A.x) / tLen,
  y: (P7.y - A.y) / tLen,
};

const seg1 = {
  p0: P2,
  c1: { x: P2.x + w * CAP_C1_X, y: P2.y },              // flat leaving P2
  c2: { x: A.x - tA.x * w * CAP_C2_X, y: A.y - tA.y * w * CAP_C2_X },
  p1: A,
};

const seg2 = {
  p0: A,
  c1: { x: A.x + tA.x * e * A_TO_P7_HANDLE, y: A.y + tA.y * e * A_TO_P7_HANDLE },
  c2: { x: P7.x - e * P7_HANDLE, y: P7.y },             // flat arriving at P7
  p1: P7,
};

const capCont =
  `C ${seg1.c1.x} ${seg1.c1.y}, ${seg1.c2.x} ${seg1.c2.y}, ${A.x} ${A.y} ` +
  `C ${seg2.c1.x} ${seg2.c1.y}, ${seg2.c2.x} ${seg2.c2.y}, ${P7.x} ${P7.y}`;

const capCurve = `M ${P2.x} ${P2.y} ${capCont}`;

const control1 = seg1.c1;
const control2 = seg1.c2;
  // -----------------------------------------
  // Path
  // -----------------------------------------

const path = `
  M ${P1.x} ${P1.y}
  L ${P2.x} ${P2.y}
  ${capCont}
  L ${P6.x} ${P6.y}
  L ${P4.x} ${P4.y}
  Z
`.trim();

const guides = {
  capHeightLine: `M ${A.x} ${A.y} L ${P5.x} ${P5.y}`,
  chord: `M ${P2.x} ${P2.y} L ${A.x} ${A.y}`,
};

const guideColors = {};

  // -----------------------------------------
  // Labels
  // -----------------------------------------

  const midXCurve =
    (P2.x + A.x) / 2;

  const midXExt =
    (A.x + P7.x) / 2;

  const labels = [
    {
      text: `${straightRunNum}"`,
      x: (P1.x + P2.x) / 2,
      y: P1.y - 8,
    },

    {
      text: "armhole curve",
      x: midXCurve + 15,
      y:
        P2.y +
        toPx(capHeight) / 2,
    },

    {
      text: "extension",
      x: midXExt + 15,
      y:
        (A.y + P7.y) / 2,
    },

    {
      text: `${totalLength}" (S.L)`,
      x: P1.x - 45,
      y:
        (P1.y + P4.y) / 2,
    },

    {
      text: `${halfBicep}" (S.A)`,
      x:
        (P4.x + P5.x) / 2,
      y: P4.y + 18,
    },

    {
      text: `${underarmEaseNum}"`,
      x:
        (P5.x + P6.x) / 2,
      y: P4.y + 18,
    },

    {
      text: `${underarmEaseNum}" ext.`,
      x:
        (A.x + P7.x) / 2,
      y:
        Math.min(A.y, P7.y) - 12,
    },

    {
      text: `${capHeight}" drop`,
      x: P1.x - 20,
      y:
        (P1.y + A.y) / 2,
    },

    {
      text: `${halfArmhole}"`,
      x: midXCurve,
      y:
        (P2.y + A.y) / 2 - 6,
      fill: "#666",
    },

    ...(Number(curveReduction) > 0
      ? [
        {
          text:
            `${curveReduction}" shallower`,
          x: midXCurve,
          y:
            (P2.y + A.y) / 2 + 10,
          fill: "#00aa00",
          fontSize: 10,
        },
      ]
      : []),
  ];

  return {
    path,
    guides,

    guideColors,
caps: { main: capCurve },
    points: {
      P1,
      P2,
      A,
      P7,
      P5,
      P6,
      P4,
    },

    controlPoints: {
      control1,
      control2,
    },

    labels,

    x: offsetX,
    y: offsetY,

    width: toPx(
      straightRunNum +
      dx +
      underarmEaseNum
    ),

    height: toPx(totalLength),
  };
};