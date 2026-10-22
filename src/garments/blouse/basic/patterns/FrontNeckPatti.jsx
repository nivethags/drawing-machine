import React from "react";

const FrontNeckPatti = ({ pattern }) => {
  if (!pattern) return null;

  return (

    < g id = "front-neck-patti-pattern" >
      <g id="front-neck-patti-pattern-bounds">
        {pattern.path && (
          <path
            className="pattern-stroke-main"
            d={pattern.path}
            fill="none"
            stroke="#009933"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
      </g>



  {/* =========================================================
          GUIDES
      ========================================================= */}
  {
    pattern.guides &&
    Object.entries(pattern.guides).map(([key, guide]) => (
      <path
        className="pattern-stroke-guide"
        key={key}
        d={guide}
        fill="none"
        stroke="#999"
        strokeWidth={1}
        strokeDasharray="5 5"
      />
    ))
  }

  {/* =========================================================
          POINTS
      ========================================================= */}
  {
    pattern.points &&
    Object.entries(pattern.points).map(([key, point]) => {
      if (
        !point ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y)
      ) {
        return null;
      }

      const pointLabel =
        pattern.pointLabels?.[key]?.text || key;

      const pointColor =
        pattern.pointLabels?.[key]?.color || "#009933";

      const pointStyle =
        pattern.pointStyles?.[key];

      return (
        <g key={key}>

          {/* POINT */}
          <circle
            className="pattern-point"
            cx={point.x}
            cy={point.y}
            r={pointStyle?.radius || 4}
            fill={pointStyle?.color || "#009933"}
          />

          {/* POINT LABEL */}
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
    })
  }

  {/* =========================================================
          CONTROL POINTS
      ========================================================= */}
  {
    pattern.controlPoints &&
    Object.entries(pattern.controlPoints).map(([key, point]) => {
      if (
        !point ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y)
      ) {
        return null;
      }

      return (
        <circle
          className="pattern-point"
          key={key}
          cx={point.x}
          cy={point.y}
          r={3}
          fill="#666"
        />
      );
    })
  }

  {/* =========================================================
          MEASUREMENT LABELS
      ========================================================= */}
  {
    pattern.labels &&
    pattern.labels.map((label, index) => {
      if (
        !label ||
        !Number.isFinite(label.x) ||
        !Number.isFinite(label.y)
      ) {
        return null;
      }

      return (
        <text
          className="pattern-label"
          key={label.id || index}
          x={label.x}
          y={label.y}
          fill={label.color || label.fill || "#333"}
          fontSize={label.fontSize || 12}
          textAnchor={label.textAnchor || "middle"}
        >
          {label.text}
        </text>
      );
    })
  }

  {/* =========================================================
          TITLE
      ========================================================= */}
  <text
    className="pattern-title"
    x={pattern.x ?? 0}
    y={(pattern.y ?? 0) - 10}
    fontSize={14}
    fill="#333"
  >
    Front Neck Patti
  </text>

    </g >
  );
};

export default FrontNeckPatti;