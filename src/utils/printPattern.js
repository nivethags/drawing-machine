// src/utils/printPattern.js

const PAPER_SIZES = {
    A4: { width: 297, height: 210 }, // landscape mm
    A3: { width: 420, height: 297 }, // landscape mm
};

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Get the bbox of an SVG group in its own user space.
 *
 * IMPORTANT: Do NOT multiply by getCTM(). That converts to
 * on-screen pixels, which is meaningless for print.
 *
 * Our pattern <g> elements have no transform on themselves,
 * so getBBox() already returns the coordinates we want:
 * 25.4 user units per inch.
 */
function getPatternBBox(el) {
    return el.getBBox();
}

/**
 * Print any pattern group, tiled across pages at true 1:1 scale.
 */
export function printPatternTiled({
    selector,
    title,
    paperType,
    margin = 5,
    overlap = 10,
}) {
    const paper = PAPER_SIZES[paperType];
    if (!paper) {
        alert("Invalid paper size.");
        return;
    }

    const group = document.querySelector(selector);
    if (!group) {
        alert(`${title} pattern group not found.`);
        return;
    }

    const boundsGroup =
        group.querySelector('[id$="-bounds"]') || group;
    console.log(`[${title}] Using bounds group:`, boundsGroup.id || "(fell back to full group)");
    console.log(`[${title}] Bounds group child count:`, boundsGroup.children.length);

    let bbox;
    try {
        bbox = getPatternBBox(boundsGroup);
    } catch (err) {
        console.error(`Unable to measure ${title}:`, err);
        alert(`Unable to measure ${title} pattern.`);
        return;
    }

    if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
        alert(`${title} pattern has no visible drawing.`);
        return;
    }

    console.log(`=== TILE DEBUG: ${title} ===`);
    console.log(`bbox (user units):`, bbox);
    console.log(`Width  : ${bbox.width.toFixed(2)} units = ${(bbox.width / 25.4).toFixed(2)}"`);
    console.log(`Height : ${bbox.height.toFixed(2)} units = ${(bbox.height / 25.4).toFixed(2)}"`);
    console.log(`Available: ${paper.width - margin * 2} × ${paper.height - margin * 2} mm`);
    console.log(`==================================`);

    // Pattern units are already mm-equivalent (1 inch = 25.4 units
    // in the calc functions, and 1 unit = 1 mm in the print SVG).
    const PRINT_SCALE = 1;

    const availW = paper.width - margin * 2;
    const availH = paper.height - margin * 2;

    const stepX = availW - overlap;
    const stepY = availH - overlap;

    const patternW = bbox.width * PRINT_SCALE;
    const patternH = bbox.height * PRINT_SCALE;

    const columns =
        patternW <= availW ? 1 : Math.ceil((patternW - availW) / stepX) + 1;

    const rows =
        patternH <= availH ? 1 : Math.ceil((patternH - availH) / stepY) + 1;

    const totalPages = rows * columns;

    console.log(
        `Tiles: ${columns} col × ${rows} row = ${totalPages} page(s)`
    );

    // -----------------------------------------------------------------
    // Build pages
    // -----------------------------------------------------------------
    const pages = [];
    let pageNum = 1;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const tileX = col * stepX;
            const tileY = row * stepY;

            const svg = document.createElementNS(SVG_NS, "svg");
            svg.setAttribute("xmlns", SVG_NS);
            svg.setAttribute("width", `${paper.width}mm`);
            svg.setAttribute("height", `${paper.height}mm`);
            svg.setAttribute("viewBox", `0 0 ${paper.width} ${paper.height}`);
            svg.setAttribute("shape-rendering", "geometricPrecision");

            // White background
            const bg = document.createElementNS(SVG_NS, "rect");
            bg.setAttribute("x", "0");
            bg.setAttribute("y", "0");
            bg.setAttribute("width", String(paper.width));
            bg.setAttribute("height", String(paper.height));
            bg.setAttribute("fill", "white");
            svg.appendChild(bg);

            // Clip path — guarantees nothing from adjacent tiles bleeds in
            const clipId = `clip-${row}-${col}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;
            const defs = document.createElementNS(SVG_NS, "defs");
            const clipPath = document.createElementNS(SVG_NS, "clipPath");
            clipPath.setAttribute("id", clipId);
            const clipRect = document.createElementNS(SVG_NS, "rect");
            clipRect.setAttribute("x", "0");
            clipRect.setAttribute("y", "0");
            clipRect.setAttribute("width", String(paper.width));
            clipRect.setAttribute("height", String(paper.height));
            clipPath.appendChild(clipRect);
            defs.appendChild(clipPath);
            svg.appendChild(defs);

            // Clone pattern
            const clone = group.cloneNode(true);
            clone.removeAttribute("id");

            // Wrapper — clip + position
            const wrapper = document.createElementNS(SVG_NS, "g");
            wrapper.setAttribute("clip-path", `url(#${clipId})`);
            wrapper.setAttribute(
                "transform",
                `translate(${margin - tileX} ${margin - tileY}) ` +
                `translate(${-bbox.x} ${-bbox.y}) ` +
                `scale(${PRINT_SCALE})`
            );
            wrapper.appendChild(clone);
            svg.appendChild(wrapper);

            // Page border
            const border = document.createElementNS(SVG_NS, "rect");
            border.setAttribute("x", "0.5");
            border.setAttribute("y", "0.5");
            border.setAttribute("width", String(paper.width - 1));
            border.setAttribute("height", String(paper.height - 1));
            border.setAttribute("fill", "none");
            border.setAttribute("stroke", "#bbb");
            border.setAttribute("stroke-width", "0.3");
            svg.appendChild(border);

            // Header
            const header = document.createElementNS(SVG_NS, "text");
            header.setAttribute("x", String(paper.width / 2));
            header.setAttribute("y", "8");
            header.setAttribute("text-anchor", "middle");
            header.setAttribute("font-size", "4");
            header.setAttribute("font-family", "Arial");
            header.textContent = `${title} — Page ${pageNum}/${totalPages} — Row ${row + 1}/${rows} Col ${col + 1}/${columns}`;
            svg.appendChild(header);

            // Calibration square (1 inch)
            const cal = document.createElementNS(SVG_NS, "rect");
            cal.setAttribute("x", "5");
            cal.setAttribute("y", String(paper.height - 30));
            cal.setAttribute("width", "25.4");
            cal.setAttribute("height", "25.4");
            cal.setAttribute("fill", "none");
            cal.setAttribute("stroke", "black");
            cal.setAttribute("stroke-width", "0.3");
            svg.appendChild(cal);

            const calText = document.createElementNS(SVG_NS, "text");
            calText.setAttribute("x", "5");
            calText.setAttribute("y", String(paper.height - 32));
            calText.setAttribute("font-size", "4");
            calText.setAttribute("font-family", "Arial");
            calText.textContent = "Verify: square = 1 inch (25.4 mm)";
            svg.appendChild(calText);

            // Alignment marks
            appendAlignmentMarks(svg, { paper, row, col, rows, columns });

            pages.push(svg.outerHTML);
            pageNum++;
        }
    }

    // -----------------------------------------------------------------
    // Open print window
    // -----------------------------------------------------------------

    
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) {
        alert("Please allow pop-ups for printing.");
        return;
    }

    

    win.document.write(buildPrintHTML({ title, paper, paperType, pages }));
    win.document.close();
}

function appendAlignmentMarks(svg, { paper, row, col, rows, columns }) {
    const cross = (cx, cy) => {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute(
            "d",
            `M ${cx - 5} ${cy} L ${cx + 5} ${cy} M ${cx} ${cy - 5} L ${cx} ${cy + 5}`
        );
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", "black");
        p.setAttribute("stroke-width", "0.4");
        svg.appendChild(p);
    };

    if (col < columns - 1) cross(paper.width - 8, paper.height / 2);
    if (col > 0) cross(8, paper.height / 2);
    if (row < rows - 1) cross(paper.width / 2, paper.height - 8);
    if (row > 0) cross(paper.width / 2, 8);
}

function buildPrintHTML({ title, paper, paperType, pages }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title} — ${paperType}</title>
<style>
  /* ============================================================
     PAGE SIZE
     ============================================================
     Declares the physical page. The browser uses this to size
     the print area. If this doesn't match the dialog's paper
     size, the browser will scale to fit — breaking 1:1.
     ============================================================ */
  @page {
    size: ${paper.width}mm ${paper.height}mm;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ============================================================
     PRINT PAGE
     ============================================================
     Fixed size. NO overflow: hidden here — clipping is done
     inside the SVG via clipPath. The div just provides a
     physical page boundary.
     ============================================================ */
  .print-page {
    width: ${paper.width}mm;
    height: ${paper.height}mm;
    background: white;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
    overflow: hidden;
    position: relative;
  }

  .print-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* ============================================================
     SVG SIZING
     ============================================================
     The SVG is sized to exactly fill the page. Its viewBox
     matches so that 1 user unit = 1 mm.
     ============================================================ */
  .print-page svg {
    display: block;
    width: ${paper.width}mm;
    height: ${paper.height}mm;
    max-width: none;
    max-height: none;
  }

  /* ============================================================
     PRINT TYPOGRAPHY SCALING
     ============================================================
     Pattern geometry is in "1 inch = 25.4 units" space. In the
     print SVG, 1 unit = 1 mm. So text with fontSize=12 would
     print 12 mm tall — far too big. These rules shrink labels
     and strokes to print-appropriate sizes without affecting
     the on-screen preview.
     ============================================================ */
  .pattern-label,
  .pattern-point-label,
  .pattern-title,
  .pattern-measurement-text {
    font-size: 2.6px !important;
  }

  .pattern-stroke-main  { stroke-width: 0.5px !important; }
  .pattern-stroke-guide { stroke-width: 0.25px !important; }
  .pattern-stroke-arc   { stroke-width: 0.35px !important; }

  .pattern-point { r: 0.7px; }

  /* ============================================================
     FORCE 1:1 IN PRINT
     ============================================================ */
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${paper.width}mm !important;
    }

    .print-page {
      margin: 0 !important;
      padding: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      transform: none !important;
      zoom: 1 !important;
    }

    .print-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    .print-page svg {
      width: ${paper.width}mm !important;
      height: ${paper.height}mm !important;
    }
  }
</style>
</head>
<body>
${pages.map((p, i) => `<div class="print-page" data-page="${i + 1}">${p}</div>`).join("")}
<script>
  window.onload = function () {
    setTimeout(function () { window.print(); }, 700);
  };
</script>
</body>
</html>`;
}