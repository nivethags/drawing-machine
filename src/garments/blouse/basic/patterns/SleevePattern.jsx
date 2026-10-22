import React from "react";

const SleevePattern = ({
  pattern,
  showGuides = true,
  patternId = "sleeve-pattern",
}) => {
  if (!pattern) return null;

  const { path, guides, points, labels } = pattern;


return (
  <g id={patternId}>
   <g id={`${patternId}-bounds`}>
    <path
      className="pattern-stroke-main"
      d={path}
      fill="none"
      stroke="#ff3300"
      strokeWidth={2}
    />
  </g>

    {showGuides && (
      <>
        {guides?.topExtension && (
          <path
            className="pattern-stroke-arc"
            d={guides.topExtension}
            fill="none"
            stroke="#00aa00"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
        {guides?.capHeightLine && (
          <path
            className="pattern-stroke-guide"
            d={guides.capHeightLine}
            fill="none"
            stroke="#999"
            strokeDasharray="3 3"
          />
        )}
      </>
    )}

    {points &&
      Object.entries(points).map(([key, pt]) => {
        if (!pt) return null;
        let dx = 6, dy = -6;
        switch (key) {
          case "P1": case "P4": dx = -14; dy = 0; break;
          case "P2": dx = 6; dy = -12; break;
          case "A": dx = -14; dy = -10; break;
          case "P7": dx = 8; dy = -10; break;
          case "P5": dx = 8; dy = 0; break;
          case "P6": dx = 14; dy = 0; break;
          default: dx = 6; dy = -6;
        }
        return (
          <g key={key}>
            <circle
              className="pattern-point"
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill="#ff3300"
            />
            <text
              className="pattern-point-label"
              x={pt.x + dx}
              y={pt.y + dy}
              fontSize={10}
              fill="#333"
              fontWeight="bold"
            >
              {key}
            </text>
          </g>
        );
      })}

    {showGuides &&
      labels?.map((label, i) => (
        <text
          className="pattern-label"
          key={i}
          x={label.x}
          y={label.y}
          fontSize={11}
          fill="#555"
        >
          {label.text}
        </text>
      ))}
  </g>
);
};


// ======================================================
// MIRROR PATTERN
// ======================================================

export const mirrorPattern = (
  pattern,
  mirrorX
) => {

  if (!pattern) {
    return null;
  }

  const mirrorPoint = (pt) =>
    pt
      ? {
          x: 2 * mirrorX - pt.x,
          y: pt.y,
        }
      : null;

  // -----------------------------------------
  // 1. MIRROR POINTS
  // -----------------------------------------

  const points = {};

  for (const [key, pt] of Object.entries(
    pattern.points || {}
  )) {
    points[key] =
      mirrorPoint(pt);
  }

  // -----------------------------------------
  // 2. MIRROR CONTROL POINTS
  // -----------------------------------------

  const originalControl1 =
    pattern.controlPoints?.control1;

  const originalControl2 =
    pattern.controlPoints?.control2;

  const control1 =
    originalControl1
      ? mirrorPoint(
          originalControl1
        )
      : {
          x:
            (points.P2.x +
              points.A.x) /
            2,

          y: points.P2.y,
        };

  const control2 =
    originalControl2
      ? mirrorPoint(
          originalControl2
        )
      : {
          x:
            (points.P2.x +
              points.A.x) /
            2,

          y: points.A.y,
        };

  // -----------------------------------------
  // 3. MIRRORED PATH
  // -----------------------------------------

  const path = `
    M ${points.P1.x} ${points.P1.y}

    L ${points.P2.x} ${points.P2.y}

    C
      ${control1.x} ${control1.y},
      ${control2.x} ${control2.y},
      ${points.A.x} ${points.A.y}

    L ${points.P7.x} ${points.P7.y}

    L ${points.P6.x} ${points.P6.y}

    L ${points.P4.x} ${points.P4.y}

    Z
  `.trim();

  // -----------------------------------------
  // 4. MIRROR GUIDES
  // -----------------------------------------

  const guides = {};

  if (pattern.guides) {

    if (pattern.guides.topExtension) {
      guides.topExtension =
        `M ${points.A.x} ${points.A.y} ` +
        `L ${points.P7.x} ${points.P7.y}`;
    }

    if (pattern.guides.capHeightLine) {
      guides.capHeightLine =
        `M ${points.A.x} ${points.A.y} ` +
        `L ${points.P5.x} ${points.P5.y}`;
    }

    if (pattern.guides.chord) {
      guides.chord =
        `M ${points.P2.x} ${points.P2.y} ` +
        `L ${points.A.x} ${points.A.y}`;
    }
  }

  // -----------------------------------------
  // 5. MIRROR LABELS
  // -----------------------------------------

  const labels = (
    pattern.labels || []
  ).map((label) => ({
    ...label,
    x:
      2 * mirrorX -
      label.x,
  }));

  // -----------------------------------------
  // 6. RETURN
  // -----------------------------------------

  return {
    ...pattern,

    points,

    controlPoints: {
      control1,
      control2,
    },

    path,

    guides,

    labels,

    x:
      mirrorX -
      pattern.width,

    y: pattern.y,

    width:
      pattern.width,

    height:
      pattern.height,
  };
};

export default SleevePattern;