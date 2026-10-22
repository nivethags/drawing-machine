// Mirror a pattern across a vertical line at x = mirrorX
export const mirrorPattern = (pattern, mirrorX) => {
  const mirrorPoint = (pt) => (pt ? { x: 2 * mirrorX - pt.x, y: pt.y } : null);

  // Mirror points
  const mirroredPoints = {};
  for (const [key, pt] of Object.entries(pattern.points)) {
    mirroredPoints[key] = mirrorPoint(pt);
  }

  // Mirror path: need to reverse the order of commands to keep winding correct
  // The path string is M... L... C... L... Z
  // We can simply build a new path by traversing the points in reverse order
  // but for simplicity, we'll recompute the path using the mirrored points with the same order as original.
  // However, the original path order goes from P1 -> P2 -> A -> P7 -> P6 -> P4 -> back to P1.
  // If we mirror, we want the path to start at the mirrored P1 and go in the same sequence
  // (which will automatically go from left to right). We'll just reuse the same path string but with mirrored coordinates.
  // Actually, we need to build a new path by applying mirror to each coordinate in the original path.
  // A simpler approach: just use the mirrored points to generate a new path using the same construction logic.
  // Since the control points are also mirrored, we can recompute them.

  const toPx = (val) => val; // scale is already applied in original points

  // We'll reuse the same control point logic using mirrored P2, A, etc.
  // But the original generator already computed the path with control points. We can just mirror those control points as well.

  // For simplicity, I'll provide a function that creates a new pattern object with mirrored points and a recomputed path.
  // I'll assume the original pattern's points are named P1, P2, A, P7, P5, P6, P4.

  const pts = mirroredPoints;
  // Compute new control points for the curve (P2 -> A) using mirrored points
const originalControl1 = pattern.controlPoints?.control1;
const originalControl2 = pattern.controlPoints?.control2;

const control1 = originalControl1
  ? mirrorPoint(originalControl1)
  : {
      x: (pts.P2.x + pts.A.x) / 2,
      y: pts.P2.y,
    };

const control2 = originalControl2
  ? mirrorPoint(originalControl2)
  : {
      x: (pts.P2.x + pts.A.x) / 2,
      y: pts.A.y,
    };

  // Build the mirrored path (same order as original)
const path = `
  M ${pts.P1.x} ${pts.P1.y}
  L ${pts.P2.x} ${pts.P2.y}
  C ${control1.x} ${control1.y},
    ${control2.x} ${control2.y},
    ${pts.A.x} ${pts.A.y}
  L ${pts.P7.x} ${pts.P7.y}
  L ${pts.P6.x} ${pts.P6.y}
  L ${pts.P4.x} ${pts.P4.y}
  Z
`.trim();

  // Mirror guides
  const mirroredGuides = {};
  if (pattern.guides) {
    for (const [key, d] of Object.entries(pattern.guides)) {
      // simple approach: mirror each coordinate in the path data
      // we can parse the path and mirror the x-coordinates
      // but to keep it simple, we'll just mirror the points and rebuild guides using the mirrored points
      if (key === 'topExtension') {
        mirroredGuides.topExtension = `M ${pts.A.x} ${pts.A.y} L ${pts.P7.x} ${pts.P7.y}`;
      } else if (key === 'capHeightLine') {
        mirroredGuides.capHeightLine = `M ${pts.P7.x} ${pts.P7.y} L ${pts.P5.x} ${pts.P5.y}`;
      } else {
        // fallback: mirror all x coordinates in the path string (naive)
        // not robust, but we'll handle the known ones above.
        mirroredGuides[key] = d.replace(/(\d+\.?\d*)/g, (match) => {
          const num = parseFloat(match);
          return (2 * mirrorX - num).toFixed(1);
        });
      }
    }
  }

  // Mirror labels: we need to adjust their x positions
  const mirroredLabels = pattern.labels.map(label => ({
    ...label,
    x: 2 * mirrorX - label.x,
  }));

  // Return new pattern object
  return {
    ...pattern,
    points: pts,
    controlPoints: {
  control1,
  control2,
},
    path,
    guides: mirroredGuides,
    labels: mirroredLabels,
    x: 2 * mirrorX - pattern.x - pattern.width, // adjust offset
    y: pattern.y,
    width: pattern.width,
    height: pattern.height,
  };
};