import React from "react";

const TextLabel = ({ x, y, text }) => {
  return (
    <text
      x={x}
      y={y}
      fontSize="14"
      fill="#000"
    >
      {text}
    </text>
  );
};

export default TextLabel;