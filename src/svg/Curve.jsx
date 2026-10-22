import React from "react";

const Curve = ({ d, color = "#000" }) => {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
  );
};

export default Curve;