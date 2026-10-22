import React, { useState } from "react";

import {
  generateSleevePattern,
} from "../../../../calculations/basic/sleeveCalculation";

import SleevePattern from "../patterns/SleevePattern";
import {
  generateBackNeckPattern,
} from "../../../../calculations/basic/backNeckCalculation";

import BackPattern from "../patterns/BackPattern";
import FrontPattern from "../patterns/FrontPattern";

import {
  generateFrontNeckPattern,
} from "../../../../calculations/basic/frontNeckCalculation";

import { generateFrontNeckPattiPattern } from "../../../../calculations/basic/frontNeckPattiCalculation";
import FrontNeckPatti from "../patterns/FrontNeckPatti";

const MeasurementForm = ({
  measurements,
  setMeasurements,
  backNeck,
  frontNeck,
  sleeve,
}) => {
  const [showDesigns, setShowDesigns] = useState(false);

  // -----------------------------------------
  // SLEEVE PATTERN
  // -----------------------------------------

  const sleeveMeasurements = {
    ...measurements,
    lengthEase: 1,
    underarmEase: 2,
    straightRun: 3,
  };

  const sleevePattern = showDesigns
    ? generateSleevePattern(
      sleeveMeasurements,
      400,
      50,
      27.15,
      3,
      0.1,
      0
    )
    : null;

  // -----------------------------------------
  // BACK NECK PATTERN
  // -----------------------------------------

  console.log("BACK NECK MEASUREMENTS:", measurements);


  const backNeckPattern = showDesigns
    ? generateBackNeckPattern(
      measurements,
      50,
      50,
      27.15
    )
    : null;

  console.log("BACK NECK PATTERN:", backNeckPattern);

  // -----------------------------------------
  // FRONT NECK PATTERN
  // -----------------------------------------

  const frontNeckPattern = showDesigns
    ? generateFrontNeckPattern(
      measurements,
      50,
      50,
      27.15
    )
    : null;

  console.log("FRONT NECK MEASUREMENTS:", measurements);
  console.log("FRONT NECK PATTERN:", frontNeckPattern);

  const frontNeckPattiPattern = showDesigns
    ? generateFrontNeckPattiPattern(
      measurements,
      50,
      50,
      27.15
    )
    : null;

  // -----------------------------------------
  // MEASUREMENT CHANGE
  // -----------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setMeasurements((prev) => ({
      ...prev,
      [name]:
        name === "customerName"
          ? value
          : value === ""
            ? ""
            : Number(value),
    }));
  };

  // -----------------------------------------
  // HIDDEN FIELDS
  // -----------------------------------------

  const hiddenFields = [];

  // -----------------------------------------
  // PROCEED
  // -----------------------------------------

  const handleProceed = () => {
    const sleeveMeasurements = {
      ...measurements,

      lengthEase: 1,
      underarmEase: 2,
      straightRun: 3,
    };

    console.log("Final Sleeve Measurements:", sleeveMeasurements);

    const testPattern = generateSleevePattern(
      sleeveMeasurements,
      400,
      50,
      27.15,
      3,
      0.1,
      0
    );

    console.log("SLEEVE PATTERN:", testPattern);

    setShowDesigns(true);
  };
  const printBackNeck = (paperType) => {
    const paperSizes = {
      A4: {
        width: 297,
        height: 210,
      },

      A3: {
        width: 420,
        height: 297,
      },
    };

    const paper = paperSizes[paperType];

    if (!paper) {
      alert("Invalid paper size.");
      return;
    }

    if (!backNeckPattern) {
      alert("Back Neck pattern is not available.");
      return;
    }

    // ---------------------------------------------------------
    // FIND BACK NECK GROUP
    // ---------------------------------------------------------

    const backNeckGroup =
      document.querySelector("#back-neck-pattern");

    if (!backNeckGroup) {
      alert("Back Neck pattern group not found.");
      return;
    }

    // ---------------------------------------------------------
    // GET ACTUAL PATTERN BOUNDING BOX
    // ---------------------------------------------------------

    let bbox;

    try {
      bbox = backNeckGroup.getBBox();
    } catch (error) {
      console.error(
        "Unable to calculate Back Neck bounding box:",
        error
      );

      alert("Unable to calculate Back Neck pattern size.");
      return;
    }

    console.log("Back Neck BBox:", bbox);

    if (
      !bbox ||
      bbox.width <= 0 ||
      bbox.height <= 0
    ) {
      alert("Back Neck pattern has no visible drawing.");
      return;
    }

    // ---------------------------------------------------------
    // IMPORTANT
    // ---------------------------------------------------------
    //
    // Pattern calculation:
    //
    // 1 inch = 27.15 SVG units
    //
    // Print SVG:
    //
    // 1 SVG unit = 1 mm
    //
    // Therefore:
    //
    // PRINT_SCALE = 1
    //
    // This preserves the exact physical measurement.
    // ---------------------------------------------------------

    const PRINT_SCALE = 1;

    // ---------------------------------------------------------
    // PAGE SETTINGS
    // ---------------------------------------------------------

    const PAGE_MARGIN = 5;

    // Overlap between adjacent pages.
    // This makes joining pages easier.
    const PAGE_OVERLAP = 10;

    // ---------------------------------------------------------
    // AVAILABLE AREA
    // ---------------------------------------------------------

    const availableWidth =
      paper.width - PAGE_MARGIN * 2;

    const availableHeight =
      paper.height - PAGE_MARGIN * 2;

    // ---------------------------------------------------------
    // PAGE MOVEMENT
    // ---------------------------------------------------------

    const horizontalStep =
      availableWidth - PAGE_OVERLAP;

    const verticalStep =
      availableHeight - PAGE_OVERLAP;

    // ---------------------------------------------------------
    // TOTAL PATTERN SIZE
    // ---------------------------------------------------------

    const patternWidth =
      bbox.width * PRINT_SCALE;

    const patternHeight =
      bbox.height * PRINT_SCALE;

    // ---------------------------------------------------------
    // NUMBER OF COLUMNS
    // ---------------------------------------------------------

    const columns =
      patternWidth <= availableWidth
        ? 1
        : Math.ceil(
          (patternWidth - availableWidth) /
          horizontalStep
        ) + 1;

    // ---------------------------------------------------------
    // NUMBER OF ROWS
    // ---------------------------------------------------------

    const rows =
      patternHeight <= availableHeight
        ? 1
        : Math.ceil(
          (patternHeight - availableHeight) /
          verticalStep
        ) + 1;

    const totalPages = rows * columns;

    console.log("=================================");
    console.log("BACK NECK PRINT");
    console.log("Paper:", paperType);
    console.log("Pattern Width:", patternWidth, "mm");
    console.log("Pattern Height:", patternHeight, "mm");
    console.log("Columns:", columns);
    console.log("Rows:", rows);
    console.log("Total Pages:", totalPages);
    console.log("=================================");

    // ---------------------------------------------------------
    // CREATE ALL PAGES
    // ---------------------------------------------------------

    const pages = [];

    let pageNumber = 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {

        // -----------------------------------------------------
        // CREATE SVG PAGE
        // -----------------------------------------------------

        const pageSvg =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );

        pageSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        pageSvg.setAttribute("width", `${paper.width}mm`);
        pageSvg.setAttribute("height", `${paper.height}mm`);
        pageSvg.setAttribute(
          "viewBox",
          `0 0 ${paper.width} ${paper.height}`
        );

        // -----------------------------------------------------
        // WHITE BACKGROUND
        // -----------------------------------------------------

        const background =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", paper.width);
        background.setAttribute("height", paper.height);
        background.setAttribute("fill", "white");

        pageSvg.appendChild(background);

        // -----------------------------------------------------
        // CURRENT TILE POSITION
        // -----------------------------------------------------

        const tileX = col * horizontalStep;
        const tileY = row * verticalStep;

        // -----------------------------------------------------
        // CLONE PATTERN
        // -----------------------------------------------------

        const clonedPattern =
          backNeckGroup.cloneNode(true);

        // Prevent duplicate ID
        clonedPattern.removeAttribute("id");

        // -----------------------------------------------------
        // POSITION PATTERN
        //
        // NO SCALE.
        // The complete pattern is moved across the pages,
        // never reduced.
        // -----------------------------------------------------

        clonedPattern.setAttribute(
          "transform",
          `
          translate(
            ${PAGE_MARGIN - tileX},
            ${PAGE_MARGIN - tileY}
          )

          translate(
            ${-bbox.x},
            ${-bbox.y}
          )

          scale(${PRINT_SCALE})
        `
        );

        pageSvg.appendChild(clonedPattern);

        // -----------------------------------------------------
        // PAGE BORDER
        // -----------------------------------------------------

        const pageBorder =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        pageBorder.setAttribute("x", "0.5");
        pageBorder.setAttribute("y", "0.5");
        pageBorder.setAttribute("width", paper.width - 1);
        pageBorder.setAttribute("height", paper.height - 1);
        pageBorder.setAttribute("fill", "none");
        pageBorder.setAttribute("stroke", "#999");
        pageBorder.setAttribute("stroke-width", "0.3");

        pageSvg.appendChild(pageBorder);

        // -----------------------------------------------------
        // PAGE NUMBER (top-right)
        // -----------------------------------------------------

        const pageText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        pageText.setAttribute("x", paper.width - 5);
        pageText.setAttribute("y", "8");
        pageText.setAttribute("text-anchor", "end");
        pageText.setAttribute("font-size", "4");
        pageText.setAttribute("font-family", "Arial");
        pageText.textContent =
          `Back Neck - Page ${pageNumber} / ${totalPages}`;

        pageSvg.appendChild(pageText);

        // -----------------------------------------------------
        // ROW / COLUMN INFO (top-left)
        // -----------------------------------------------------

        const positionText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        positionText.setAttribute("x", "5");
        positionText.setAttribute("y", "8");
        positionText.setAttribute("font-size", "4");
        positionText.setAttribute("font-family", "Arial");
        positionText.textContent =
          `Row ${row + 1} / ${rows}   Column ${col + 1} / ${columns}`;

        pageSvg.appendChild(positionText);

        // -----------------------------------------------------
        // CALIBRATION SQUARE
        // -----------------------------------------------------

        const calibration =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        calibration.setAttribute("x", "5");
        calibration.setAttribute("y", `${paper.height - 30}`);
        calibration.setAttribute("width", "27.15");
        calibration.setAttribute("height", "27.15");
        calibration.setAttribute("fill", "none");
        calibration.setAttribute("stroke", "black");
        calibration.setAttribute("stroke-width", "0.3");

        // pageSvg.appendChild(calibration);

        // -----------------------------------------------------
        // CALIBRATION TEXT
        // -----------------------------------------------------

        const calibrationText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        calibrationText.setAttribute("x", "5");
        calibrationText.setAttribute("y", `${paper.height - 32}`);
        calibrationText.setAttribute("font-size", "4");
        calibrationText.setAttribute("font-family", "Arial");
        calibrationText.textContent = "1 inch = 27.15 mm";

        // pageSvg.appendChild(calibrationText);

        // -----------------------------------------------------
        // ALIGNMENT MARK - RIGHT (cross)
        // -----------------------------------------------------

        if (col < columns - 1) {
          const rightMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX = paper.width - 8;
          const markY = paper.height / 2;

          rightMark.setAttribute(
            "d",
            `
            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}

            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}
          `
          );

          rightMark.setAttribute("fill", "none");
          rightMark.setAttribute("stroke", "black");
          rightMark.setAttribute("stroke-width", "0.4");

          pageSvg.appendChild(rightMark);
        }

        // -----------------------------------------------------
        // ALIGNMENT MARK - LEFT (cross)
        // -----------------------------------------------------

        if (col > 0) {
          const leftMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX = 8;
          const markY = paper.height / 2;

          leftMark.setAttribute(
            "d",
            `
            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}

            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}
          `
          );

          leftMark.setAttribute("fill", "none");
          leftMark.setAttribute("stroke", "black");
          leftMark.setAttribute("stroke-width", "0.4");

          pageSvg.appendChild(leftMark);
        }

        // -----------------------------------------------------
        // ALIGNMENT MARK - BOTTOM (cross)
        // -----------------------------------------------------

        if (row < rows - 1) {
          const bottomMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX = paper.width / 2;
          const markY = paper.height - 8;

          bottomMark.setAttribute(
            "d",
            `
            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}

            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}
          `
          );

          bottomMark.setAttribute("fill", "none");
          bottomMark.setAttribute("stroke", "black");
          bottomMark.setAttribute("stroke-width", "0.4");

          pageSvg.appendChild(bottomMark);
        }

        // -----------------------------------------------------
        // ALIGNMENT MARK - TOP (cross)
        // -----------------------------------------------------

        if (row > 0) {
          const topMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX = paper.width / 2;
          const markY = 8;

          topMark.setAttribute(
            "d",
            `
            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}

            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}
          `
          );

          topMark.setAttribute("fill", "none");
          topMark.setAttribute("stroke", "black");
          topMark.setAttribute("stroke-width", "0.4");

          pageSvg.appendChild(topMark);
        }

        // -----------------------------------------------------
        // SAVE PAGE
        // -----------------------------------------------------

        pages.push(pageSvg.outerHTML);

        pageNumber++;
      }
    }

    // ---------------------------------------------------------
    // OPEN PRINT WINDOW
    // ---------------------------------------------------------

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=900"
      );

    if (!printWindow) {
      alert("Please allow pop-ups for printing.");
      return;
    }

    // ---------------------------------------------------------
    // PRINT DOCUMENT
    // ---------------------------------------------------------

    printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <title>
          Back Neck Pattern - ${paperType}
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

            overflow: hidden;

            background: white;

            page-break-after: always;
            break-after: page;
          }

          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .print-page svg {
            display: block;

            width:
              ${paper.width}mm;

            height:
              ${paper.height}mm;
          }

          @media print {

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-page {
              margin: 0 !important;
              padding: 0 !important;

              page-break-after: always;
            }

            .print-page:last-child {
              page-break-after: auto;
            }

          }

        </style>

      </head>

      <body>

        ${pages
        .map(
          (page) => `
              <div class="print-page">
                ${page}
              </div>
            `
        )
        .join("")}

        <script>

          window.onload = function () {

            setTimeout(function () {

              window.print();

            }, 700);

          };

        </script>

      </body>

    </html>
  `);

    printWindow.document.close();
  };
  const printSleeve = (paperType) => {
    const paperSizes = {
      A4: {
        width: 297,
        height: 210,
      },

      A3: {
        width: 420,
        height: 297,
      },
    };

    const paper = paperSizes[paperType];

    if (!paper) {
      alert("Invalid paper size.");
      return;
    }

    if (!sleevePattern) {
      alert("Sleeve pattern is not available.");
      return;
    }

    // =========================================================
    // FIND SLEEVE PATTERN GROUP
    // =========================================================

    const sleeveGroup =
      document.querySelector("#sleeve-pattern");

    if (!sleeveGroup) {
      alert("Sleeve pattern group not found.");
      return;
    }

    // =========================================================
    // GET ACTUAL SVG BOUNDING BOX
    // =========================================================

    let bbox;

    try {
      bbox = sleeveGroup.getBBox();
    } catch (error) {
      console.error(
        "Unable to calculate Sleeve bounding box:",
        error
      );

      alert("Unable to calculate Sleeve pattern size.");
      return;
    }

    console.log("Sleeve BBox:", bbox);

    if (
      !bbox ||
      bbox.width <= 0 ||
      bbox.height <= 0
    ) {
      alert("Sleeve pattern has no visible drawing.");
      return;
    }

    // =========================================================
    // EXACT 1:1 PRINT SCALE
    // =========================================================
    //
    // Pattern calculation uses:
    //
    // 1 inch = 27.15 SVG units
    //
    // Print SVG uses:
    //
    // 1 SVG unit = 1 mm
    //
    // Therefore PRINT_SCALE must remain 1.
    // =========================================================

    const PRINT_SCALE = 1;

    // =========================================================
    // PAGE SETTINGS
    // =========================================================

    const PAGE_MARGIN = 5;

    // Amount of overlap between neighboring pages.
    // This helps align and join the pages.
    const PAGE_OVERLAP = 10;

    // =========================================================
    // AVAILABLE PRINT AREA
    // =========================================================

    const availableWidth =
      paper.width - PAGE_MARGIN * 2;

    const availableHeight =
      paper.height - PAGE_MARGIN * 2;

    // =========================================================
    // PAGE STEP
    // =========================================================

    const horizontalStep =
      availableWidth - PAGE_OVERLAP;

    const verticalStep =
      availableHeight - PAGE_OVERLAP;

    // =========================================================
    // COMPLETE SLEEVE SIZE
    // =========================================================

    const patternWidth =
      bbox.width * PRINT_SCALE;

    const patternHeight =
      bbox.height * PRINT_SCALE;

    // =========================================================
    // CALCULATE NUMBER OF COLUMNS
    // =========================================================

    const columns = Math.max(
      1,
      Math.ceil(
        (patternWidth - availableWidth) /
        horizontalStep
      ) + 1
    );

    // =========================================================
    // CALCULATE NUMBER OF ROWS
    // =========================================================

    const rows = Math.max(
      1,
      Math.ceil(
        (patternHeight - availableHeight) /
        verticalStep
      ) + 1
    );

    console.log("=================================");
    console.log("SLEEVE PRINT");
    console.log("Paper:", paperType);
    console.log("Pattern Width:", patternWidth, "mm");
    console.log("Pattern Height:", patternHeight, "mm");
    console.log("Columns:", columns);
    console.log("Rows:", rows);
    console.log(
      "Total Pages:",
      columns * rows
    );
    console.log("=================================");

    // =========================================================
    // CREATE ALL PRINT PAGES
    // =========================================================

    let pagesHTML = "";

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {

        // -----------------------------------------------------
        // CURRENT TILE POSITION
        // -----------------------------------------------------

        const tileX =
          col * horizontalStep;

        const tileY =
          row * verticalStep;

        // -----------------------------------------------------
        // CLONE SLEEVE
        // -----------------------------------------------------

        const clonedPattern =
          sleeveGroup.cloneNode(true);

        // Remove original ID
        clonedPattern.removeAttribute("id");

        // -----------------------------------------------------
        // POSITION SLEEVE ON CURRENT PAGE
        // -----------------------------------------------------

        clonedPattern.setAttribute(
          "transform",
          `
          translate(
            ${PAGE_MARGIN - tileX},
            ${PAGE_MARGIN - tileY}
          )

          translate(
            ${-bbox.x},
            ${-bbox.y}
          )

          scale(${PRINT_SCALE})
        `
        );

        // =====================================================
        // CREATE PAGE SVG
        // =====================================================

        const pageSvg = `
        <svg
          xmlns="http://www.w3.org/2000/svg"

          width="${paper.width}mm"
          height="${paper.height}mm"

          viewBox="
            0
            0
            ${paper.width}
            ${paper.height}
          "
        >

          <!-- ========================================= -->
          <!-- WHITE BACKGROUND -->
          <!-- ========================================= -->

          <rect
            x="0"
            y="0"
            width="${paper.width}"
            height="${paper.height}"
            fill="white"
          />

          <!-- ========================================= -->
          <!-- SLEEVE PATTERN -->
          <!-- ========================================= -->

          ${clonedPattern.outerHTML}

          <!-- ========================================= -->
          <!-- 1 INCH CALIBRATION SQUARE -->
          <!-- ========================================= -->

          <rect
            x="5"
            y="${paper.height - 32}"
            width="27.15"
            height="27.15"

            fill="none"
            stroke="black"
            stroke-width="0.1"
          />

          <!-- ========================================= -->
          <!-- CALIBRATION TEXT -->
          <!-- ========================================= -->

          <text
            x="5"
            y="${paper.height - 34}"

            font-size="4"
            font-family="Arial"

            fill="black"
          >
            1 inch = 27.15 mm
          </text>

          <!-- ========================================= -->
          <!-- LEFT JOIN MARKS -->
          <!-- ========================================= -->

          ${col > 0
            ? `
                <line
                  x1="0"
                  y1="${paper.height / 2 - 10}"
                  x2="8"
                  y2="${paper.height / 2 - 10}"

                  stroke="black"
                  stroke-width="0.5"
                />

                <line
                  x1="0"
                  y1="${paper.height / 2 + 10}"
                  x2="8"
                  y2="${paper.height / 2 + 10}"

                  stroke="black"
                  stroke-width="0.5"
                />
              `
            : ""
          }

          <!-- ========================================= -->
          <!-- RIGHT JOIN MARKS -->
          <!-- ========================================= -->

          ${col < columns - 1
            ? `
                <line
                  x1="${paper.width - 8}"
                  y1="${paper.height / 2 - 10}"
                  x2="${paper.width}"
                  y2="${paper.height / 2 - 10}"

                  stroke="black"
                  stroke-width="0.5"
                />

                <line
                  x1="${paper.width - 8}"
                  y1="${paper.height / 2 + 10}"
                  x2="${paper.width}"
                  y2="${paper.height / 2 + 10}"

                  stroke="black"
                  stroke-width="0.5"
                />
              `
            : ""
          }

          <!-- ========================================= -->
          <!-- TOP JOIN MARKS -->
          <!-- ========================================= -->

          ${row > 0
            ? `
                <line
                  x1="${paper.width / 2 - 10}"
                  y1="0"
                  x2="${paper.width / 2 - 10}"
                  y2="8"

                  stroke="black"
                  stroke-width="0.5"
                />

                <line
                  x1="${paper.width / 2 + 10}"
                  y1="0"
                  x2="${paper.width / 2 + 10}"
                  y2="8"

                  stroke="black"
                  stroke-width="0.5"
                />
              `
            : ""
          }

          <!-- ========================================= -->
          <!-- BOTTOM JOIN MARKS -->
          <!-- ========================================= -->

          ${row < rows - 1
            ? `
                <line
                  x1="${paper.width / 2 - 10}"
                  y1="${paper.height - 8}"
                  x2="${paper.width / 2 - 10}"
                  y2="${paper.height}"

                  stroke="black"
                  stroke-width="0.5"
                />

                <line
                  x1="${paper.width / 2 + 10}"
                  y1="${paper.height - 8}"
                  x2="${paper.width / 2 + 10}"
                  y2="${paper.height}"

                  stroke="black"
                  stroke-width="0.5"
                />
              `
            : ""
          }

        </svg>
      `;

        // =====================================================
        // ADD PAGE HTML
        // =====================================================

        pagesHTML += `
        <div class="print-page">

          ${pageSvg}

          <div class="page-info">

            Sleeve -
            ${paperType}

            |

            Page
            ${row * columns + col + 1}
            of
            ${rows * columns}

            |

            Row ${row + 1},
            Column ${col + 1}

          </div>

        </div>
      `;
      }
    }

    // =========================================================
    // OPEN PRINT WINDOW
    // =========================================================

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=900"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups for printing."
      );

      return;
    }

    // =========================================================
    // PRINT HTML
    // =========================================================

    printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <title>
          Sleeve Pattern - ${paperType}
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

            position: relative;

            width:
              ${paper.width}mm;

            height:
              ${paper.height}mm;

            overflow: hidden;

            background: white;

            page-break-after: always;
          }

          .print-page:last-child {
            page-break-after: auto;
          }

          .print-page svg {

            display: block;

            width:
              ${paper.width}mm;

            height:
              ${paper.height}mm;
          }

          .page-info {

            position: absolute;

            left: 5mm;

            bottom: 2mm;

            font-family: Arial, sans-serif;

            font-size: 3mm;

            background: white;

            padding: 0.5mm 1mm;
          }

          @media print {

            html,
            body {

              margin: 0 !important;
              padding: 0 !important;
            }

            .print-page {

              margin: 0 !important;
              padding: 0 !important;

              page-break-after: always;
            }

            .print-page:last-child {

              page-break-after: auto;
            }

          }

        </style>

      </head>

      <body>

        ${pagesHTML}

        <script>

          window.onload = function () {

            setTimeout(function () {

              window.print();

            }, 700);

          };

        </script>

      </body>

    </html>
  `);

    printWindow.document.close();
  };

  const printFrontNeck = (paperType) => {
    const paperSizes = {
      A4: {
        width: 297,
        height: 210,
      },

      A3: {
        width: 420,
        height: 297,
      },
    };

    const paper = paperSizes[paperType];

    if (!paper) {
      alert("Invalid paper size.");
      return;
    }

    if (!frontNeckPattern) {
      alert("Front Neck pattern is not available.");
      return;
    }

    // =========================================================
    // FIND FRONT NECK GROUP
    // =========================================================

    const frontNeckGroup =
      document.querySelector("#front-neck-pattern");

    if (!frontNeckGroup) {
      alert("Front Neck pattern group not found.");
      return;
    }

    // =========================================================
    // GET COMPLETE BOUNDING BOX
    // =========================================================

    let bbox;

    try {
      bbox = frontNeckGroup.getBBox();
    } catch (error) {
      console.error(
        "Unable to calculate Front Neck bounding box:",
        error
      );

      alert(
        "Unable to calculate Front Neck pattern size."
      );

      return;
    }

    console.log(
      "Front Neck BBox:",
      bbox
    );

    if (
      !bbox ||
      bbox.width <= 0 ||
      bbox.height <= 0
    ) {
      alert(
        "Front Neck pattern has no visible drawing."
      );

      return;
    }

    // =========================================================
    // REAL PHYSICAL SIZE
    // =========================================================
    //
    // IMPORTANT:
    //
    // DO NOT SCALE THE PATTERN.
    //
    // Your calculation uses:
    //
    //     1 inch = 27.15 units
    //
    // Print SVG uses:
    //
    //     1 unit = 1 mm
    //
    // Therefore:
    //
    //     27.15 units = 27.15 mm = 1 inch
    //
    // =========================================================

    const PRINT_SCALE = 1;

    // =========================================================
    // PAGE SETTINGS
    // =========================================================

    const PAGE_MARGIN = 5;

    // Pages overlap by 10 mm.
    //
    // This allows the user to join neighboring pages
    // accurately.
    //
    const PAGE_OVERLAP = 10;

    // =========================================================
    // ACTUAL PATTERN SIZE
    // =========================================================

    const patternWidth =
      bbox.width * PRINT_SCALE;

    const patternHeight =
      bbox.height * PRINT_SCALE;

    console.log(
      "REAL PATTERN WIDTH:",
      patternWidth,
      "mm"
    );

    console.log(
      "REAL PATTERN HEIGHT:",
      patternHeight,
      "mm"
    );

    // =========================================================
    // AVAILABLE PATTERN AREA
    // =========================================================

    const availableWidth =
      paper.width -
      PAGE_MARGIN * 2;

    const availableHeight =
      paper.height -
      PAGE_MARGIN * 2;

    // =========================================================
    // PAGE STEP
    //
    // Example:
    //
    // A4 width = 297
    // overlap = 10
    //
    // next page begins at:
    //
    // 297 - 10 = 287 mm
    //
    // =========================================================

    const horizontalStep =
      availableWidth - PAGE_OVERLAP;

    const verticalStep =
      availableHeight - PAGE_OVERLAP;

    // =========================================================
    // NUMBER OF HORIZONTAL PAGES
    // =========================================================

    const columns =
      patternWidth <= availableWidth
        ? 1
        : Math.ceil(
          (patternWidth - availableWidth) /
          horizontalStep
        ) + 1;

    // =========================================================
    // NUMBER OF VERTICAL PAGES
    // =========================================================

    const rows =
      patternHeight <= availableHeight
        ? 1
        : Math.ceil(
          (patternHeight - availableHeight) /
          verticalStep
        ) + 1;

    // =========================================================
    // TOTAL PAGES
    // =========================================================

    const totalPages =
      rows * columns;

    console.log(
      "PRINT COLUMNS:",
      columns
    );

    console.log(
      "PRINT ROWS:",
      rows
    );

    console.log(
      "TOTAL PRINT PAGES:",
      totalPages
    );

    // =========================================================
    // CREATE ALL PAGES
    // =========================================================

    const pages = [];

    let pageNumber = 1;

    for (
      let row = 0;
      row < rows;
      row++
    ) {
      for (
        let column = 0;
        column < columns;
        column++
      ) {

        // =====================================================
        // CREATE SVG PAGE
        // =====================================================

        const pageSvg =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );

        pageSvg.setAttribute(
          "xmlns",
          "http://www.w3.org/2000/svg"
        );

        pageSvg.setAttribute(
          "width",
          `${paper.width}mm`
        );

        pageSvg.setAttribute(
          "height",
          `${paper.height}mm`
        );

        pageSvg.setAttribute(
          "viewBox",
          `0 0 ${paper.width} ${paper.height}`
        );

        // =====================================================
        // WHITE BACKGROUND
        // =====================================================

        const background =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        background.setAttribute(
          "x",
          "0"
        );

        background.setAttribute(
          "y",
          "0"
        );

        background.setAttribute(
          "width",
          paper.width
        );

        background.setAttribute(
          "height",
          paper.height
        );

        background.setAttribute(
          "fill",
          "white"
        );

        pageSvg.appendChild(
          background
        );

        // =====================================================
        // CURRENT PAGE POSITION
        // =====================================================

        const tileX =
          column * horizontalStep;

        const tileY =
          row * verticalStep;

        // =====================================================
        // CLONE FRONT NECK
        // =====================================================

        const clonedPattern =
          frontNeckGroup.cloneNode(true);

        // =====================================================
        // POSITION PATTERN
        //
        // NO SCALE.
        //
        // This is the important part.
        //
        // The complete pattern is moved across the pages.
        // It is NEVER reduced.
        // =====================================================

        clonedPattern.setAttribute(
          "transform",
          `
          translate(
            ${PAGE_MARGIN - tileX},
            ${PAGE_MARGIN - tileY}
          )

          translate(
            ${-bbox.x},
            ${-bbox.y}
          )

          scale(${PRINT_SCALE})
        `
        );

        pageSvg.appendChild(
          clonedPattern
        );

        // =====================================================
        // PAGE BORDER
        // =====================================================

        const pageBorder =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        pageBorder.setAttribute(
          "x",
          "0.5"
        );

        pageBorder.setAttribute(
          "y",
          "0.5"
        );

        pageBorder.setAttribute(
          "width",
          paper.width - 1
        );

        pageBorder.setAttribute(
          "height",
          paper.height - 1
        );

        pageBorder.setAttribute(
          "fill",
          "none"
        );

        pageBorder.setAttribute(
          "stroke",
          "#999"
        );

        pageBorder.setAttribute(
          "stroke-width",
          "0.3"
        );

        pageSvg.appendChild(
          pageBorder
        );

        // =====================================================
        // PAGE NUMBER
        // =====================================================

        const pageText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        pageText.setAttribute(
          "x",
          paper.width - 5
        );

        pageText.setAttribute(
          "y",
          "8"
        );

        pageText.setAttribute(
          "text-anchor",
          "end"
        );

        pageText.setAttribute(
          "font-size",
          "4"
        );

        pageText.setAttribute(
          "font-family",
          "Arial"
        );

        pageText.textContent =
          `Front Neck - Page ${pageNumber} / ${totalPages}`;

        pageSvg.appendChild(
          pageText
        );

        // =====================================================
        // ROW / COLUMN INFORMATION
        // =====================================================

        const positionText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        positionText.setAttribute(
          "x",
          "5"
        );

        positionText.setAttribute(
          "y",
          "8"
        );

        positionText.setAttribute(
          "font-size",
          "4"
        );

        positionText.setAttribute(
          "font-family",
          "Arial"
        );

        positionText.textContent =
          `Row ${row + 1} / ${rows}   Column ${column + 1
          } / ${columns}`;

        pageSvg.appendChild(
          positionText
        );

        // =====================================================
        // CALIBRATION SQUARE
        // =====================================================

        const calibration =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        calibration.setAttribute(
          "x",
          "5"
        );

        calibration.setAttribute(
          "y",
          `${paper.height - 30}`
        );

        calibration.setAttribute(
          "width",
          "27.15"
        );

        calibration.setAttribute(
          "height",
          "27.15"
        );

        calibration.setAttribute(
          "fill",
          "none"
        );

        calibration.setAttribute(
          "stroke",
          "black"
        );

        calibration.setAttribute(
          "stroke-width",
          "0.3"
        );

        // pageSvg.appendChild(
        //   calibration
        // );

        // =====================================================
        // CALIBRATION TEXT
        // =====================================================

        const calibrationText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        calibrationText.setAttribute(
          "x",
          "5"
        );

        calibrationText.setAttribute(
          "y",
          `${paper.height - 32}`
        );

        calibrationText.setAttribute(
          "font-size",
          "4"
        );

        calibrationText.setAttribute(
          "font-family",
          "Arial"
        );

        calibrationText.textContent =
          "1 inch = 27.15 mm";

        // pageSvg.appendChild(
        //   calibrationText
        // );

        // =====================================================
        // ALIGNMENT MARK - RIGHT
        // =====================================================

        if (
          column <
          columns - 1
        ) {

          const rightMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX =
            paper.width - 8;

          const markY =
            paper.height / 2;

          rightMark.setAttribute(
            "d",
            `
            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}

            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}
          `
          );

          rightMark.setAttribute(
            "fill",
            "none"
          );

          rightMark.setAttribute(
            "stroke",
            "black"
          );

          rightMark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(
            rightMark
          );
        }

        // =====================================================
        // ALIGNMENT MARK - LEFT
        // =====================================================

        if (
          column > 0
        ) {

          const leftMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX = 8;

          const markY =
            paper.height / 2;

          leftMark.setAttribute(
            "d",
            `
            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}

            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}
          `
          );

          leftMark.setAttribute(
            "fill",
            "none"
          );

          leftMark.setAttribute(
            "stroke",
            "black"
          );

          leftMark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(
            leftMark
          );
        }

        // =====================================================
        // ALIGNMENT MARK - BOTTOM
        // =====================================================

        if (
          row <
          rows - 1
        ) {

          const bottomMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX =
            paper.width / 2;

          const markY =
            paper.height - 8;

          bottomMark.setAttribute(
            "d",
            `
            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}

            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}
          `
          );

          bottomMark.setAttribute(
            "fill",
            "none"
          );

          bottomMark.setAttribute(
            "stroke",
            "black"
          );

          bottomMark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(
            bottomMark
          );
        }

        // =====================================================
        // ALIGNMENT MARK - TOP
        // =====================================================

        if (
          row > 0
        ) {

          const topMark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const markX =
            paper.width / 2;

          const markY = 8;

          topMark.setAttribute(
            "d",
            `
            M ${markX} ${markY - 5}
            L ${markX} ${markY + 5}

            M ${markX - 5} ${markY}
            L ${markX + 5} ${markY}
          `
          );

          topMark.setAttribute(
            "fill",
            "none"
          );

          topMark.setAttribute(
            "stroke",
            "black"
          );

          topMark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(
            topMark
          );
        }

        // =====================================================
        // SAVE PAGE
        // =====================================================

        pages.push(
          pageSvg.outerHTML
        );

        pageNumber++;
      }
    }

    // =========================================================
    // OPEN PRINT WINDOW
    // =========================================================

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups for printing."
      );

      return;
    }

    // =========================================================
    // CREATE PRINT HTML
    // =========================================================

    printWindow.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <title>
        Front Neck Pattern - ${paperType}
      </title>

      <style>

        @page {
          size:
            ${paper.width}mm
            ${paper.height}mm;

          margin: 0;
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

          page-break-after: always;

          break-after: page;

          overflow: hidden;
        }

        .print-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        svg {
          display: block;

          width:
            ${paper.width}mm;

          height:
            ${paper.height}mm;
        }

      </style>

    </head>

    <body>

      ${pages
        .map(
          (page) => `
            <div class="print-page">
              ${page}
            </div>
          `
        )
        .join("")}

      <script>

        window.onload = function () {

          setTimeout(function () {

            window.print();

          }, 800);

        };

      </script>

    </body>

    </html>
  `);

    printWindow.document.close();
  };

  const printFrontNeckPatti = (paperType) => {
    const paperSizes = {
      A4: {
        width: 297,
        height: 210,
      },

      A3: {
        width: 420,
        height: 297,
      },
    };

    const paper = paperSizes[paperType];

    if (!paper) {
      alert("Invalid paper size.");
      return;
    }


    
    if (!frontNeckPattiPattern) {
      alert(
        "Front Neck Patti is not available for this chest size."
      );
      return;
    }

    // =========================================================
    // FIND FRONT NECK PATTI GROUP
    // =========================================================

    const pattiGroup =
      document.querySelector(
        "#front-neck-patti-pattern"
      );

    if (!pattiGroup) {
      alert(
        "Front Neck Patti pattern group not found."
      );
      return;
    }

    // =========================================================
    // GET BOUNDING BOX
    // =========================================================

    let bbox;

    try {
      bbox = pattiGroup.getBBox();
    } catch (error) {
      console.error(
        "Unable to calculate Front Neck Patti bounding box:",
        error
      );

      alert(
        "Unable to calculate Front Neck Patti size."
      );

      return;
    }

    console.log(
      "Front Neck Patti BBox:",
      bbox
    );

    if (
      !bbox ||
      bbox.width <= 0 ||
      bbox.height <= 0
    ) {
      alert(
        "Front Neck Patti has no visible drawing."
      );

      return;
    }

    // =========================================================
    // 1:1 PRINT
    // =========================================================

    const PRINT_SCALE = 1;

    const PAGE_MARGIN = 5;

    const PAGE_OVERLAP = 10;

    // =========================================================
    // AVAILABLE PAGE AREA
    // =========================================================

    const availableWidth =
      paper.width -
      PAGE_MARGIN * 2;

    const availableHeight =
      paper.height -
      PAGE_MARGIN * 2;

    // =========================================================
    // PAGE STEP
    // =========================================================

    const horizontalStep =
      availableWidth -
      PAGE_OVERLAP;

    const verticalStep =
      availableHeight -
      PAGE_OVERLAP;

    // =========================================================
    // PATTERN SIZE
    // =========================================================

    const patternWidth =
      bbox.width * PRINT_SCALE;

    const patternHeight =
      bbox.height * PRINT_SCALE;

    // =========================================================
    // COLUMNS
    // =========================================================

    const columns =
      patternWidth <= availableWidth
        ? 1
        : Math.ceil(
          (patternWidth - availableWidth) /
          horizontalStep
        ) + 1;

    // =========================================================
    // ROWS
    // =========================================================

    const rows =
      patternHeight <= availableHeight
        ? 1
        : Math.ceil(
          (patternHeight - availableHeight) /
          verticalStep
        ) + 1;

    const totalPages =
      rows * columns;

    console.log(
      "================================="
    );

    console.log(
      "FRONT NECK PATTI PRINT"
    );

    console.log(
      "Paper:",
      paperType
    );

    console.log(
      "Pattern Width:",
      patternWidth,
      "mm"
    );

    console.log(
      "Pattern Height:",
      patternHeight,
      "mm"
    );

    console.log(
      "Columns:",
      columns
    );

    console.log(
      "Rows:",
      rows
    );

    console.log(
      "Total Pages:",
      totalPages
    );

    console.log(
      "================================="
    );

    // =========================================================
    // CREATE PAGES
    // =========================================================

    const pages = [];

    let pageNumber = 1;

    for (
      let row = 0;
      row < rows;
      row++
    ) {
      for (
        let column = 0;
        column < columns;
        column++
      ) {

        // =====================================================
        // CREATE PAGE SVG
        // =====================================================

        const pageSvg =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );

        pageSvg.setAttribute(
          "xmlns",
          "http://www.w3.org/2000/svg"
        );

        pageSvg.setAttribute(
          "width",
          `${paper.width}mm`
        );

        pageSvg.setAttribute(
          "height",
          `${paper.height}mm`
        );

        pageSvg.setAttribute(
          "viewBox",
          `0 0 ${paper.width} ${paper.height}`
        );

        // =====================================================
        // BACKGROUND
        // =====================================================

        const background =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        background.setAttribute(
          "x",
          "0"
        );

        background.setAttribute(
          "y",
          "0"
        );

        background.setAttribute(
          "width",
          paper.width
        );

        background.setAttribute(
          "height",
          paper.height
        );

        background.setAttribute(
          "fill",
          "white"
        );

        pageSvg.appendChild(
          background
        );

        // =====================================================
        // TILE POSITION
        // =====================================================

        const tileX =
          column * horizontalStep;

        const tileY =
          row * verticalStep;

        // =====================================================
        // CLONE PATTI
        // =====================================================

        const clonedPattern =
          pattiGroup.cloneNode(true);

        clonedPattern.removeAttribute(
          "id"
        );

        // =====================================================
        // POSITION
        // =====================================================

        clonedPattern.setAttribute(
          "transform",
          `
        translate(
          ${PAGE_MARGIN - tileX},
          ${PAGE_MARGIN - tileY}
        )

        translate(
          ${-bbox.x},
          ${-bbox.y}
        )

        scale(${PRINT_SCALE})
        `
        );

        pageSvg.appendChild(
          clonedPattern
        );

        // =====================================================
        // PAGE BORDER
        // =====================================================

        const pageBorder =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        pageBorder.setAttribute(
          "x",
          "0.5"
        );

        pageBorder.setAttribute(
          "y",
          "0.5"
        );

        pageBorder.setAttribute(
          "width",
          paper.width - 1
        );

        pageBorder.setAttribute(
          "height",
          paper.height - 1
        );

        pageBorder.setAttribute(
          "fill",
          "none"
        );

        pageBorder.setAttribute(
          "stroke",
          "#999"
        );

        pageBorder.setAttribute(
          "stroke-width",
          "0.3"
        );

        pageSvg.appendChild(
          pageBorder
        );

        // =====================================================
        // PAGE NUMBER
        // =====================================================

        const pageText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        pageText.setAttribute(
          "x",
          paper.width - 5
        );

        pageText.setAttribute(
          "y",
          "8"
        );

        pageText.setAttribute(
          "text-anchor",
          "end"
        );

        pageText.setAttribute(
          "font-size",
          "4"
        );

        pageText.setAttribute(
          "font-family",
          "Arial"
        );

        // pageText.textContent =
        //   `Front Neck Patti - Page ${pageNumber} / ${totalPages}`;

        pageSvg.appendChild(
          pageText
        );

        // =====================================================
        // ROW / COLUMN
        // =====================================================

        const positionText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        positionText.setAttribute(
          "x",
          "5"
        );

        positionText.setAttribute(
          "y",
          "8"
        );

        positionText.setAttribute(
          "font-size",
          "4"
        );

        positionText.setAttribute(
          "font-family",
          "Arial"
        );

        positionText.textContent =
          `Row ${row + 1} / ${rows}   Column ${column + 1
          } / ${columns}`;

        pageSvg.appendChild(
          positionText
        );

        // =====================================================
        // CALIBRATION SQUARE
        // =====================================================

        const calibration =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        calibration.setAttribute(
          "x",
          "5"
        );

        calibration.setAttribute(
          "y",
          `${paper.height - 30}`
        );

        calibration.setAttribute(
          "width",
          "27.15"
        );

        calibration.setAttribute(
          "height",
          "27.15"
        );

        calibration.setAttribute(
          "fill",
          "none"
        );

        calibration.setAttribute(
          "stroke",
          "black"
        );

        calibration.setAttribute(
          "stroke-width",
          "0.3"
        );

        // pageSvg.appendChild(
        //   calibration
        // );

        // =====================================================
        // CALIBRATION TEXT
        // =====================================================

        const calibrationText =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        calibrationText.setAttribute(
          "x",
          "5"
        );

        calibrationText.setAttribute(
          "y",
          `${paper.height - 32}`
        );

        calibrationText.setAttribute(
          "font-size",
          "4"
        );

        calibrationText.setAttribute(
          "font-family",
          "Arial"
        );

        calibrationText.textContent =
          "1 inch = 27.15 mm";

        // pageSvg.appendChild(
        //   calibrationText
        // );

        // =====================================================
        // JOIN MARKS
        // =====================================================

        if (column < columns - 1) {

          const mark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const x =
            paper.width - 8;

          const y =
            paper.height / 2;

          mark.setAttribute(
            "d",
            `
          M ${x - 5} ${y}
          L ${x + 5} ${y}

          M ${x} ${y - 5}
          L ${x} ${y + 5}
          `
          );

          mark.setAttribute(
            "fill",
            "none"
          );

          mark.setAttribute(
            "stroke",
            "black"
          );

          mark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(mark);
        }

        if (column > 0) {

          const mark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const x = 8;

          const y =
            paper.height / 2;

          mark.setAttribute(
            "d",
            `
          M ${x - 5} ${y}
          L ${x + 5} ${y}

          M ${x} ${y - 5}
          L ${x} ${y + 5}
          `
          );

          mark.setAttribute(
            "fill",
            "none"
          );

          mark.setAttribute(
            "stroke",
            "black"
          );

          mark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(mark);
        }

        if (row < rows - 1) {

          const mark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const x =
            paper.width / 2;

          const y =
            paper.height - 8;

          mark.setAttribute(
            "d",
            `
          M ${x} ${y - 5}
          L ${x} ${y + 5}

          M ${x - 5} ${y}
          L ${x + 5} ${y}
          `
          );

          mark.setAttribute(
            "fill",
            "none"
          );

          mark.setAttribute(
            "stroke",
            "black"
          );

          mark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(mark);
        }

        if (row > 0) {

          const mark =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );

          const x =
            paper.width / 2;

          const y = 8;

          mark.setAttribute(
            "d",
            `
          M ${x} ${y - 5}
          L ${x} ${y + 5}

          M ${x - 5} ${y}
          L ${x + 5} ${y}
          `
          );

          mark.setAttribute(
            "fill",
            "none"
          );

          mark.setAttribute(
            "stroke",
            "black"
          );

          mark.setAttribute(
            "stroke-width",
            "0.4"
          );

          pageSvg.appendChild(mark);
        }

        pages.push(
          pageSvg.outerHTML
        );

        pageNumber++;
      }
    }

    // =========================================================
    // PRINT WINDOW
    // =========================================================

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups for printing."
      );

      return;
    }

    printWindow.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <title>
        Front Neck Patti - ${paperType}
      </title>

      <style>

        @page {
          size:
            ${paper.width}mm
            ${paper.height}mm;

          margin: 0;
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

          overflow: hidden;

          page-break-after: always;

          break-after: page;
        }

        .print-page:last-child {

          page-break-after: auto;

          break-after: auto;
        }

        .print-page svg {

          display: block;

          width:
            ${paper.width}mm;

          height:
            ${paper.height}mm;
        }

        @media print {

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-page {

            margin: 0 !important;
            padding: 0 !important;

            page-break-after: always;
          }

          .print-page:last-child {
            page-break-after: auto;
          }
        }

      </style>

    </head>

    <body>

      ${pages
        .map(
          (page) => `
            <div class="print-page">
              ${page}
            </div>
          `
        )
        .join("")}

      <script>

        window.onload = function () {

          setTimeout(function () {

            window.print();

          }, 700);

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
        padding: 24,
        background: "#f8f9fb",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* =========================================
      MEASUREMENT FORM
  ========================================= */}

      <div
        style={{
          width: 360,
          padding: 24,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 24,
            fontSize: 22,
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          Measurements
        </h2>

        {Object.keys(measurements).map((key) => (
          <div
            key={key}
            style={{
              marginBottom: 16,
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: 7,
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              {key}
            </label>

            <input
              type={
                key === "customerName"
                  ? "text"
                  : "number"
              }
              step="0.1"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 7,
                outline: "none",
                fontSize: 14,
                boxSizing: "border-box",
              }}
              name={key}
              value={measurements[key] ?? ""}
              onChange={handleChange}
            />
          </div>
        ))}

        {/* PROCEED BUTTON */}

        <button
          type="button"
          onClick={handleProceed}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "12px 20px",
            border: "none",
            borderRadius: 7,
            background: "#111827",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Proceed
        </button>

      </div>

      {/* =========================================
SELECTED DESIGNS
========================================= */}



      {showDesigns && (
        <div
          style={{
            marginTop: 30,
            padding: 24,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 20,
              fontSize: 22,
              fontWeight: 600,
              color: "#1f2937",
            }}
          >
            Selected Designs </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 20,
            }}
          >
            {/* =====================================
        FRONT NECK
    ===================================== */}

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 14,
                  fontSize: 17,
                  color: "#1f2937",
                }}
              >
                Front Neck
              </h3>

              <div
                style={{
                  width: "100%",
                  height: 250,
                  background: "#ffffff",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #eee",
                }}
              >
                {frontNeckPattern ? (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 1200 800"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <FrontPattern
                      pattern={frontNeckPattern}
                    />
                  </svg>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      color: "#6b7280",
                    }}
                  >
                    <p>
                      Unable to generate front neck pattern.
                    </p>
                  </div>
                )}
              </div>

              <p>
                <strong>{frontNeck?.name}</strong>
              </p>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                {frontNeck?.type}
              </p>
              {/* PRINT BUTTONS */}

              {frontNeckPattern && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => printFrontNeck("A4")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #111827",
                      borderRadius: 7,
                      background: "#111827",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🖨 A4
                  </button>

                  <button
                    type="button"
                    onClick={() => printFrontNeck("A3")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #111827",
                      borderRadius: 7,
                      background: "#ffffff",
                      color: "#111827",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🖨 A3
                  </button>
                </div>
              )}
            </div>

            {/* =====================================
        BACK NECK
    ===================================== */}

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 14,
                  fontSize: 17,
                  color: "#1f2937",
                }}
              >
                Back Neck
              </h3>

              {/* BACK NECK PATTERN CANVAS */}

              <div
                style={{
                  width: "100%",
                  height: 250,
                  background: "#ffffff",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #eee",
                }}
              >
                {backNeckPattern ? (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 1200 800"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <BackPattern
                      pattern={backNeckPattern}
                    />
                  </svg>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      color: "#6b7280",
                    }}
                  >
                    <p>
                      Unable to generate back neck pattern.
                    </p>
                  </div>
                )}
              </div>

              <p>
                <strong>{backNeck?.name}</strong>
              </p>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                {backNeck?.type}
              </p>

              {/* PRINT BUTTONS */}

              {backNeckPattern && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => printBackNeck("A4")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #111827",
                      borderRadius: 7,
                      background: "#111827",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🖨 A4
                  </button>

                  <button
                    type="button"
                    onClick={() => printBackNeck("A3")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #111827",
                      borderRadius: 7,
                      background: "#ffffff",
                      color: "#111827",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🖨 A3
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 14,
                  fontSize: 17,
                  color: "#1f2937",
                }}
              >
                Sleeve
              </h3>

              {/* SLEEVE PATTERN CANVAS */}

              <div
                style={{
                  width: "100%",
                  height: 250,
                  background: "#ffffff",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #eee",
                }}
              >
                {sleevePattern ? (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 1200 800"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <SleevePattern
                      pattern={sleevePattern}
                    />
                  </svg>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      color: "#6b7280",
                    }}
                  >
                    <p>
                      Unable to generate sleeve pattern.
                    </p>
                  </div>
                )}
              </div>

              <p>
                <strong>{sleeve?.name}</strong>
              </p>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                {sleeve?.type}
              </p>
              {/* PRINT BUTTONS */}

              {sleevePattern && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => printSleeve("A4")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #111827",
                      borderRadius: 7,
                      background: "#111827",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🖨 A4
                  </button>

                  <button
                    type="button"
                    onClick={() => printSleeve("A3")}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #111827",
                      borderRadius: 7,
                      background: "#ffffff",
                      color: "#111827",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🖨 A3
                  </button>
                </div>
              )}
            </div>

            {/* =====================================
    FRONT NECK PATTI
===================================== */}

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
                background: "#ffffff",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 14,
                  fontSize: 17,
                  color: "#1f2937",
                }}
              >
                Front Neck Patti
              </h3>

              {/* =====================================
      FRONT NECK PATTI PATTERN CANVAS
  ===================================== */}

              <div
                style={{
                  width: "100%",
                  height: 200,
                  background: "#ffffff",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #eee",
                }}
              >
                {frontNeckPattiPattern ? (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 400 150"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <FrontNeckPatti
                      pattern={frontNeckPattiPattern}
                    />
                  </svg>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      color: "#6b7280",
                    }}
                  >
                    <p>
                      Front Neck Patti is available
                      only for chest 30 to 38.
                    </p>
                  </div>
                )}
              </div>

              {/* =====================================
      DETAILS
  ===================================== */}

              {frontNeckPattiPattern && (
                <>
                  <p>
                    <strong>
                      Front Neck Patti
                    </strong>
                  </p>

                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    12" Width / 3.5" Height /
                    2.5" Center Dip
                  </p>

                  {/* =====================================
          PRINT BUTTONS
      ===================================== */}

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        printFrontNeckPatti("A4")
                      }
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1px solid #111827",
                        borderRadius: 7,
                        background: "#111827",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      🖨 A4
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        printFrontNeckPatti("A3")
                      }
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1px solid #111827",
                        borderRadius: 7,
                        background: "#ffffff",
                        color: "#111827",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      🖨 A3
                    </button>
                  </div>
                </>
              )}

            </div>

          </div>
        </div>

      )}

    </div>

  );
};

export default MeasurementForm;
