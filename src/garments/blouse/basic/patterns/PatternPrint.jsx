import React from "react";

const PAPER_SIZES = {
  A4: {
    width: 210,
    height: 297,
  },
  A3: {
    width: 297,
    height: 420,
  },
};

const PatternPrint = ({
  pattern,
  title = "Pattern",
}) => {
  if (!pattern) return null;

  const printPattern = (paperType) => {
    const paper = PAPER_SIZES[paperType];

    const margin = 15;

    /*
     * Pattern coordinates are already generated
     * using scale = 25.4.
     *
     * Therefore we keep the pattern at 100%.
     */

    const patternWidth =
      pattern.width || 1200;

    const patternHeight =
      pattern.height || 800;

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=800"
    );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the pattern."
      );
      return;
    }

    /*
     * Build SVG content from the same pattern
     * data used by BackPattern.
     */

    const guides = pattern.guides
      ? Object.values(pattern.guides)
          .map(
            (guide) => `
              <path
                d="${guide}"
                fill="none"
                stroke="#999"
                stroke-width="1"
                stroke-dasharray="5 5"
              />
            `
          )
          .join("")
      : "";

    const points = pattern.points
      ? Object.entries(pattern.points)
          .map(
            ([key, point]) => `
              <circle
                cx="${point.x}"
                cy="${point.y}"
                r="4"
                fill="#009933"
              />

              <text
                x="${point.x + 7}"
                y="${point.y - 7}"
                font-size="12"
              >
                ${key}
              </text>
            `
          )
          .join("")
      : "";

    const controlPoints =
      pattern.controlPoints
        ? Object.values(
            pattern.controlPoints
          )
            .map(
              (point) => `
                <circle
                  cx="${point.x}"
                  cy="${point.y}"
                  r="3"
                  fill="#666"
                />
              `
            )
            .join("")
        : "";

    const labels = pattern.labels
      ? pattern.labels
          .map(
            (label) => `
              <text
                x="${label.x}"
                y="${label.y}"
                fill="${label.fill || "#333"}"
                font-size="${
                  label.fontSize || 12
                }"
              >
                ${label.text}
              </text>
            `
          )
          .join("")
      : "";

    const mainPath = pattern.path
      ? `
          <path
            d="${pattern.path}"
            fill="none"
            stroke="#009933"
            stroke-width="2"
          />
        `
      : "";

    const titleText = `
      <text
        x="15"
        y="12"
        font-size="14"
        font-family="Arial"
      >
        ${title}
      </text>
    `;

    const svgContent = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${patternWidth}mm"
        height="${patternHeight}mm"
        viewBox="0 0 ${patternWidth} ${patternHeight}"
      >

        ${titleText}

        ${mainPath}

        ${guides}

        ${points}

        ${controlPoints}

        ${labels}

      </svg>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            ${title} - ${paperType}
          </title>

          <style>

            @page {
              size:
                ${paper.width}mm
                ${paper.height}mm;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            .print-page {

              width:
                ${paper.width}mm;

              height:
                ${paper.height}mm;

              position: relative;

              overflow: hidden;

              page-break-after: always;
            }

            .pattern {

              position: absolute;

              left: ${margin}mm;

              top: ${margin}mm;

              width:
                ${patternWidth}mm;

              height:
                ${patternHeight}mm;
            }

            .calibration {

              position: absolute;

              left: 15mm;

              bottom: 10mm;

              width: 25.4mm;

              height: 25.4mm;

              border:
                0.3mm solid black;
            }

            .calibration-text {

              position: absolute;

              left: 15mm;

              bottom: 5mm;

              font-family: Arial, sans-serif;

              font-size: 3mm;
            }

            @media print {

              body {
                margin: 0;
              }

              .print-page {
                page-break-after: always;
              }

            }

          </style>

        </head>

        <body>

          <div class="print-page">

            <div class="pattern">

              ${svgContent}

            </div>

            <div class="calibration"></div>

            <div class="calibration-text">

              1 inch calibration square

            </div>

          </div>

          <script>

            window.onload = function () {

              setTimeout(
                function () {
                  window.print();
                },
                500
              );

            };

          </script>

        </body>

      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: 10,
        marginBottom: 10,
      }}
    >
      <button
        type="button"
        onClick={() =>
          printPattern("A4")
        }
        style={{
          padding: "8px 16px",
          cursor: "pointer",
          border: "1px solid #333",
          borderRadius: 5,
          background: "#fff",
        }}
      >
        🖨 Print A4
      </button>

      <button
        type="button"
        onClick={() =>
          printPattern("A3")
        }
        style={{
          padding: "8px 16px",
          cursor: "pointer",
          border: "1px solid #333",
          borderRadius: 5,
          background: "#fff",
        }}
      >
        🖨 Print A3
      </button>
    </div>
  );
};

export default PatternPrint;
