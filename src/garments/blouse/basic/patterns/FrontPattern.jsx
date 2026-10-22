import React from "react";

const FrontPattern = ({ pattern }) => {
  if (!pattern) return null;

  return (
    <g id="front-neck-pattern">
      {/* =========================================================
          MAIN FRONT NECK PATTERN
      ========================================================= */}
      <g id="front-neck-pattern-bounds">
    {pattern.path && (
      <path
        className="pattern-stroke-main"
        d={pattern.path}
        fill="none"
        stroke="#009933"
        strokeWidth={1}
      />
    )}
  </g>

      {/* =========================================================
          GUIDES
      ========================================================= */}
      {pattern.guides &&
        Object.entries(pattern.guides).map(
          ([key, guide]) => (
            <path
              className="pattern-stroke-guide"
              key={key}
              d={guide}
              fill="none"
              stroke="#999"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          )
        )}

      {/* =========================================================
          POINTS
      ========================================================= */}
      {pattern.points &&
        Object.entries(pattern.points).map(
          ([key, point]) => {
            const pointLabel =
              pattern.pointLabels?.[key]?.text || key;

            const pointColor =
              pattern.pointLabels?.[key]?.color || "#009933";

            const pointStyle =
              pattern.pointStyles?.[key];

            return (
              <g key={key}>
                <circle
                  className="pattern-point"
                  cx={point.x}
                  cy={point.y}
                  r={pointStyle?.radius || 4}
                  fill={pointStyle?.color || "#009933"}
                />

                <text
                  className="pattern-point-label"
                  x={point.x + 7}
                  y={point.y - 7}
                  fontSize={12}
                  fill={pointColor}
                >
                  {pointLabel}
                </text>
              </g>
            );
          }
        )}

      {/* =========================================================
          CONTROL POINTS
      ========================================================= */}
      {pattern.controlPoints &&
        Object.entries(pattern.controlPoints).map(
          ([key, point]) => (
            <circle
              className="pattern-point"
              key={key}
              cx={point.x}
              cy={point.y}
              r={3}
              fill="#666"
            />
          )
        )}

      {/* =========================================================
          LABELS
      ========================================================= */}
      {pattern.labels &&
        pattern.labels.map((label, index) => (
          <text
            className="pattern-label"
            key={index}
            x={label.x}
            y={label.y}
            fill={label.fill || "#333"}
            fontSize={label.fontSize || 12}
          >
            {label.text}
          </text>
        ))}

      {/* =========================================================
          TITLE
      ========================================================= */}
      <text
        className="pattern-title"
        x={pattern.x ?? 0}
        y={(pattern.y ?? 0) - 10}
        fontSize={14}
      >
        Front Neck
      </text>
    </g>
  );
};

export default FrontPattern;