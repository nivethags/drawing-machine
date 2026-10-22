import React from "react";

const Line = ({ x1, y1, x2, y2, color = "#000", width = 2 }) => {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={width}
    />
  );
};

export default Line;