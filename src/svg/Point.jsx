import React from "react";

const Point = ({ x, y, r = 3, color = "red" }) => {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
    />
  );
};

export default Point;