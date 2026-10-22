  import React, { useRef } from "react";

  import Grid from "../../../../components/pattern/Grid";

  import {
    generateSleevePattern,
  } from "../../../../calculations/basic/sleeveCalculation";

  import {
    mirrorPattern,
  } from "./SleevePattern";

  import {
    generateFrontNeckPattern,
  } from "../../../../calculations/basic/frontNeckCalculation";

  import FrontPattern from "./FrontPattern";
  import SleevePattern from "./SleevePattern";


  const PatternCanvas = ({
    measurements,
    backNeck,
    frontNeck,
    sleeve,
  }) => {


    const svgRef = useRef(null);

    // -----------------------------------------
    // FRONT NECK PATTERN
    // -----------------------------------------

    const frontNeckPattern = generateFrontNeckPattern(
      measurements,
      100,
      50,
      25.4
    );


    // -----------------------------------------
    // RIGHT PATTERN
    // -----------------------------------------

    const rightPattern = generateSleevePattern(
      measurements,
      400,
      50,
      25.4,
      3,
      0.1,
      0
    );


    // -----------------------------------------
    // LEFT PATTERN
    // -----------------------------------------

    const tempLeftPattern = generateSleevePattern(
      measurements,
      400,
      50,
      25.4,
      3,
      0.1,
      0.5
    );


    const leftPattern = tempLeftPattern
      ? mirrorPattern(tempLeftPattern, 400)
      : null;


    // -----------------------------------------
    // PRINT
    // -----------------------------------------

    const printPattern = (paperType) => {
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

      const svg = svgRef.current;

      if (!svg) {
        alert("SVG not found.");
        return;
      }

      if (!rightPattern) {
        alert("Sleeve pattern is not available.");
        return;
      }

      // -----------------------------------------
      // PRINTING MARGIN
      // -----------------------------------------

      const margin = 10;

      // -----------------------------------------
      // ACTUAL SLEEVE SIZE
      //
      // generateSleevePattern uses:
      // 1 inch = 25.4 SVG units
      //
      // Therefore these values are already in mm.
      // -----------------------------------------

      const patternWidth = rightPattern.width;
      const patternHeight = rightPattern.height;

      console.log("Sleeve width:", patternWidth);
      console.log("Sleeve height:", patternHeight);

      // -----------------------------------------
      // AVAILABLE PRINT AREA
      // -----------------------------------------

      const availableWidth =
        paper.width - margin * 2;

      const availableHeight =
        paper.height - margin * 2;

      // -----------------------------------------
      // CHECK WIDTH
      // -----------------------------------------

      if (patternWidth > availableWidth) {
        alert(
          `Sleeve is too wide for ${paperType} Landscape.\n\n` +
          `Sleeve width: ${patternWidth.toFixed(1)} mm\n` +
          `Available width: ${availableWidth.toFixed(1)} mm`
        );

        return;
      }

      // -----------------------------------------
      // CHECK HEIGHT
      // -----------------------------------------

      if (patternHeight > availableHeight) {
        alert(
          `Sleeve is too high for ${paperType} Landscape.\n\n` +
          `Sleeve height: ${patternHeight.toFixed(1)} mm\n` +
          `Available height: ${availableHeight.toFixed(1)} mm`
        );

        return;
      }

      // -----------------------------------------
      // FIND SLEEVE GROUP
      // -----------------------------------------

      const sleeveGroup =
        svg.querySelector("#sleeve-pattern");

      if (!sleeveGroup) {
        alert("Sleeve pattern group not found.");
        return;
      }

      // Clone ONLY the sleeve
      const clonedSleeve =
        sleeveGroup.cloneNode(true);

      // -----------------------------------------
      // CENTER SLEEVE ON PAPER
      // -----------------------------------------

      const x =
        (paper.width - patternWidth) / 2;

      const y =
        (paper.height - patternHeight) / 2;

      // Original pattern starts at rightPattern.x/y.
      //
      // Move it so that it starts at x/y
      // on the print page.

      const translateX =
        x - rightPattern.x;

      const translateY =
        y - rightPattern.y;

      clonedSleeve.setAttribute(
        "transform",
        `translate(${translateX}, ${translateY})`
      );

      // -----------------------------------------
      // CREATE NEW PRINT SVG
      // -----------------------------------------

      const printSvg =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );

      // Physical paper size
      printSvg.setAttribute(
        "width",
        `${paper.width}mm`
      );

      printSvg.setAttribute(
        "height",
        `${paper.height}mm`
      );

      // IMPORTANT:
      // SVG coordinates are now exactly millimeters.
      printSvg.setAttribute(
        "viewBox",
        `0 0 ${paper.width} ${paper.height}`
      );

      printSvg.setAttribute(
        "xmlns",
        "http://www.w3.org/2000/svg"
      );

      // Do NOT scale the pattern.
      printSvg.setAttribute(
        "preserveAspectRatio",
        "none"
      );

      // -----------------------------------------
      // WHITE BACKGROUND
      // -----------------------------------------

      const background =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );

      background.setAttribute("x", "0");
      background.setAttribute("y", "0");
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

      printSvg.appendChild(background);

      // -----------------------------------------
      // ADD SLEEVE
      // -----------------------------------------

      printSvg.appendChild(
        clonedSleeve
      );

      // -----------------------------------------
      // CALIBRATION SQUARE
      // -----------------------------------------

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
        "25.4"
      );

      calibration.setAttribute(
        "height",
        "25.4"
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

      printSvg.appendChild(
        calibration
      );

      // -----------------------------------------
      // CALIBRATION LABEL
      // -----------------------------------------

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

      calibrationText.textContent =
        "1 inch = 25.4 mm";

      printSvg.appendChild(
        calibrationText
      );

      // -----------------------------------------
      // OPEN PRINT WINDOW
      // -----------------------------------------

      const printWindow =
        window.open(
          "",
          "_blank"
        );

      if (!printWindow) {
        alert(
          "Please allow pop-ups for printing."
        );

        return;
      }

      // -----------------------------------------
      // PRINT HTML
      // -----------------------------------------

      printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <title>
          Sleeve Pattern - ${paperType} Landscape
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

            width:
              ${paper.width}mm;

            height:
              ${paper.height}mm;

            background: white;
          }

          body {
            display: flex;

            justify-content: center;
            align-items: center;
          }

          svg {
            display: block;

            width:
              ${paper.width}mm;

            height:
              ${paper.height}mm;
          }

          @media print {

            html,
            body {
              margin: 0;
              padding: 0;
            }

          }

        </style>

      </head>

      <body>

        ${printSvg.outerHTML}

        <script>

          window.onload = function () {

            setTimeout(function () {

              window.print();

            }, 500);

          };

        </script>

      </body>

      </html>
    `);

      printWindow.document.close();
    };
    
    // -----------------------------------------
    // UI
    // -----------------------------------------

    return (

      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: "#f2f2f2",
          padding: 20,
        }}
      >

        {/* Buttons */}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
          }}
        >

          <button
            onClick={() =>
              printPattern("A4")
            }
          >
            Print A4
          </button>


          <button
            onClick={() =>
              printPattern("A3")
            }
          >
            Print A3
          </button>

        </div>


        {/* Pattern */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >

          <svg
            ref={svgRef}
            width={1200}
            height={800}
            viewBox="0 0 1200 800"
            style={{
              background: "#fff",
              border: "1px solid #ddd",
            }}
          >

            <Grid />


            {/* <SleevePattern
              pattern={leftPattern}
            /> */}

            <FrontPattern
              pattern={frontNeckPattern}
            />

            <SleevePattern
              pattern={rightPattern}
            />

          </svg>

        </div>

      </div>

    );
  };


  export default PatternCanvas;