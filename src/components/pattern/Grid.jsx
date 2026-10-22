import React from "react";

const Grid = () => {
  const lines = [];

  for (let i = 0; i <= 1200; i += 25) {
    lines.push(
      <line
        key={"v" + i}
        x1={i}
        y1={0}
        x2={i}
        y2={800}
        stroke="#eeeeee"
      />
    );
  }

  for (let i = 0; i <= 800; i += 25) {
    lines.push(
      <line
        key={"h" + i}
        x1={0}
        y1={i}
        x2={1200}
        y2={i}
        stroke="#eeeeee"
      />
    );
  }

  return <>{lines}</>;
};

export default Grid;