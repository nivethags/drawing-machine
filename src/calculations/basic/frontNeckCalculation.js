export const generateFrontNeckPattern = (
    measurements = {},
    offsetX = 0,
    offsetY = 0,
    scale = 25.4
) => {
    const {
        hip,
        armhole,
        fLength,
        chest,
        fNeck,
        shoulder,
        pakkaKazhuthu,
    } = measurements;
    // =========================================================
    // FRONT NECK MEASUREMENT MAPPING
    //
    // Front Neck reuses the same geometry as Back Neck, but its
    // height inputs come from front-specific measurement fields:
    //
    //   fLength -> Full Length   (maps to backLength)
    //   fNeck   -> Design Height (maps to backNeckDesignLength)
    // =========================================================

    const backLength = fLength;
    const backNeckDesignLength = fNeck;

    // =========================================================
    // CONSTANTS – adjust these to match your reference image
    // =========================================================

    const SHOULDER_EXTRA = 0.75;       // Shoulder + 3/4"
    const NECK_TOP_EXTRA = 0.5;        // 0.5" above Back Length
    const NECK_BOTTOM_EXTRA = 0.5;       // 1" below Back Length

    const P6_EASE = 0.5;
    const P7_EXTENSION = 2;
    const P8_EXTENSION = 2;

    const STRAIGHT_OFFSET = 2;

    const VERTICAL_INFLUENCE_FACTOR = 0.5;

    // Armhole curve shape
    const ARMHOLE_DX_RATIO = 0.45;
    const ARMHOLE_DY_RATIO = 1.1;

    // Left-side stitching ease: a reference line 0.5" to the
    // left of the A / P4 / D column, running from A's height
    // down to D's height (dotted guide only, does not change
    // the main stitching path).
    const P4_LEFT_EASE = 0.5;



    // =========================================================
    // CUBIC BEZIER POINT
    // =========================================================

    const cubicBezierPoint = (p0, c1, c2, p1, t) => {
        const mt = 1 - t;

        const x =
            mt * mt * mt * p0.x +
            3 * mt * mt * t * c1.x +
            3 * mt * t * t * c2.x +
            t * t * t * p1.x;

        const y =
            mt * mt * mt * p0.y +
            3 * mt * mt * t * c1.y +
            3 * mt * t * t * c2.y +
            t * t * t * p1.y;

        return { x, y };
    };

    const createSmoothCurve = (points, opts = {}) => {
        const {
            flattenPointIndex = -1, // index of the point whose tangent gets flattened
            flattenAmount = 0.6,    // 0 = full Catmull-Rom, 1 = fully horizontal
        } = opts;

        const n = points.length;

        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < n - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(n - 1, i + 2)];

            let c1 = {
                x: p1.x + (p2.x - p0.x) / 6,
                y: p1.y + (p2.y - p0.y) / 6,
            };

            let c2 = {
                x: p2.x - (p3.x - p1.x) / 6,
                y: p2.y - (p3.y - p1.y) / 6,
            };

            // Flatten the OUTGOING tangent at `flattenPointIndex`
            if (i === flattenPointIndex) {
                const tx = c1.x - p1.x;
                const ty = c1.y - p1.y;
                const tlen = Math.hypot(tx, ty);

                if (tlen > 0) {
                    c1 = {
                        x: p1.x + tx * (1 - flattenAmount) + tlen * flattenAmount,
                        y: p1.y + ty * (1 - flattenAmount),
                    };
                }
            }

            // Flatten the INCOMING tangent at `flattenPointIndex`
            if (i + 1 === flattenPointIndex) {
                const tx = p2.x - c2.x;
                const ty = p2.y - c2.y;
                const tlen = Math.hypot(tx, ty);

                if (tlen > 0) {
                    const newTx = tx * (1 - flattenAmount) + tlen * flattenAmount;
                    const newTy = ty * (1 - flattenAmount);

                    c2 = {
                        x: p2.x - newTx,
                        y: p2.y - newTy,
                    };
                }
            }

            d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
        }

        return d;
    };

    const createReverseSmoothCurve = (points) => {
        return createSmoothCurve([...points].reverse());
    };

    // =========================================================
    // CUBIC BEZIER LENGTH
    // =========================================================

    const cubicBezierLength = (
        p0,
        c1,
        c2,
        p1,
        samples = 60
    ) => {
        let length = 0;
        let prev = p0;

        for (let i = 1; i <= samples; i++) {
            const t = i / samples;

            const pt = cubicBezierPoint(
                p0,
                c1,
                c2,
                p1,
                t
            );

            length += Math.hypot(
                pt.x - prev.x,
                pt.y - prev.y
            );

            prev = pt;
        }

        return length;
    };

    // =========================================================
    // SOLVE CURVE BY ARC LENGTH
    // =========================================================
    //
    // IMPORTANT:
    //
    // P2 remains on the A horizontal line.
    //
    // The 0.5" A → B ease is NOT removed from P2.
    //
    // Instead, verticalOffsetPx is added between P2 and P3.
    //
    // Therefore:
    //
    // A
    // ───────────────────── P2
    // │                       \
    // │ 0.5"                   \
    // B ─────────────────────── \
    //                             ) P3
    //
    // The actual P2 → P3 curve length is still
    // Armhole / 2.
    //
    // =========================================================

    const solveCurveByArcLength = ({
        start,
        dxRatio,
        dyRatio,
        verticalOffsetPx = 0,
        targetLengthPx,
        toPxFn,
    }) => {
        const buildCurve = (sInches) => {
            const dxPx = toPxFn(
                sInches * dxRatio
            );

            const curveDyPx = toPxFn(
                sInches * dyRatio
            );

            // -------------------------------------------------------
            // IMPORTANT:
            //
            // P2 stays at A level.
            //
            // The 0.5" B reference is added to the vertical
            // distance before reaching P3.
            // -------------------------------------------------------

            const dyPx =
                verticalOffsetPx + curveDyPx;

            const end = {
                x: start.x + dxPx,
                y: start.y + dyPx,
            };

            // -------------------------------------------------------
            // CONTROL POINT 1
            //
            // Starts almost vertically downward from P2.
            // -------------------------------------------------------

            const control1 = {
                x: start.x + dxPx * 0.1,
                y: start.y + dyPx * 0.6,
            };

            // -------------------------------------------------------
            // CONTROL POINT 2
            //
            // Approaches P3 horizontally from the left.
            // This keeps the armhole curve on the RIGHT side.
            // -------------------------------------------------------

            const control2 = {
                x: end.x - dxPx * 0.6,
                y: end.y - dyPx * 0.1,
            };

            return {
                end,
                control1,
                control2,
            };
        };

        // -------------------------------------------------------
        // BINARY SEARCH
        // -------------------------------------------------------

        let low = 0;

        let high =
            targetLengthPx / scale + 5;

        let result = buildCurve(high);

        for (let iter = 0; iter < 40; iter++) {
            const mid =
                (low + high) / 2;

            const curve =
                buildCurve(mid);

            const length =
                cubicBezierLength(
                    start,
                    curve.control1,
                    curve.control2,
                    curve.end
                );

            if (length < targetLengthPx) {
                low = mid;
            } else {
                high = mid;
            }

            result = curve;
        }

        return result;
    };

    // =========================================================
    // COLORS
    // =========================================================

    const COLORS = {
        // POINT COLORS
        A: "#000000",

        P1: "#1565C0",
        P2: "#2E7D32",
        P3: "#D32F2F",
        P4: "#7B1FA2",
        D: "#F57C00",
        P6: "#00838F",
        P7: "#C2185B",
        P8: "#6D4C41",
        S: "#E91E63",

        // Left-side ease line points (H, H1, H2)
        H: "#9E9E9E",

        // POINTER / MEASUREMENT COLORS
        A_P1: "#1565C0",
        P1_P2: "#2E7D32",

        P2_P3_CHEST: "#D32F2F",
        P2_P3_ARMHOLE: "#E65100",

        A_P4: "#7B1FA2",
        P1_P4: "#8E24AA",

        A_D: "#F57C00",

        D_P6: "#00838F",
        P6_P7: "#C2185B",

        P3_P8: "#6D4C41",
        P8_P7: "#5D4037",

        P3_P6: "#757575",

        // Left-side ease line (dotted)
        EASE_LINE: "#9E9E9E",

        label: "#212121",
    };

    // =========================================================
    // CHECK MEASUREMENTS
    // =========================================================

    const requiredMeasurements = [
        hip,
        armhole,
        fLength,
        chest,
        fNeck,
        shoulder,
        pakkaKazhuthu,
    ];

    const hasInvalidMeasurement =
        requiredMeasurements.some(
            (value) =>
                value === "" ||
                value === null ||
                value === undefined ||
                !Number.isFinite(Number(value))
        );

    if (hasInvalidMeasurement) {
        return null;
    }

    // =========================================================
    // CONVERT TO NUMBERS
    // =========================================================

    const hipNum = Number(hip);
    const armholeNum = Number(armhole);

    // B → C = fLength (the "backLength" slot everything else uses)
    const backLengthNum = Number(fLength);

    const chestNum = Number(chest);

    // FNeck is measured from B down to P4:
    // P4 distance from A = NECK_TOP_EXTRA (A→B, 0.5") + fNeck
    const backNeckDesignLengthNum =
        NECK_TOP_EXTRA + Number(fNeck);

    const shoulderNum = Number(shoulder);
    const pakkaKazhuthuNum =
        Number(pakkaKazhuthu);

    // =========================================================
    // INCHES → PIXELS
    // =========================================================

    const toPx = (value) =>
        Number(value) * scale;

    // =========================================================
    // A
    // =========================================================

    const A = {
        x: offsetX,
        y: offsetY,
    };

    // =========================================================
    // P1
    // =========================================================

    const p1Distance =
        pakkaKazhuthuNum / 2;

    const P1 = {
        x:
            A.x +
            toPx(p1Distance),

        y: A.y,
    };

    // =========================================================
    // P2
    // =========================================================
    //
    // Shoulder + 0.75"
    //
    // P2 REMAINS ON A'S HORIZONTAL LINE.
    //
    // =========================================================

    const p1ToP2 =
        shoulderNum +
        SHOULDER_EXTRA;

    const P2 = {
        x:
            P1.x +
            toPx(p1ToP2),

        y: A.y,
    };

    // =========================================================
    // SHOULDER EASE REFERENCE POINT
    // =========================================================
    //
    // Example:
    //
    // Shoulder = 3"
    // Shoulder Ease = 0.75"
    //
    // P1 → SE = 3"
    // SE → P2 = 0.75"
    //
    // =========================================================

    const SE = {
        x:
            P1.x +
            toPx(shoulderNum),

        y: P1.y,
    };

    // =========================================================
    // P4
    // =========================================================

    const P4 = {
        x: A.x,
        y:
            A.y +
            toPx(
                backNeckDesignLengthNum
            ),
    };

    // =========================================================
    // B
    // =========================================================
    //
    // A → B = 0.5"
    //
    // THIS IS NOW USED IN THE ARMHOLE
    // VERTICAL CALCULATION.
    //
    // =========================================================

    const B = {
        x: A.x,
        y:
            A.y +
            toPx(NECK_TOP_EXTRA),
    };



    const P2_EASE_POINT = {
        x: P2.x,
        y: B.y,
    };


    const verticalTrialDepths = [
        5,
        5.5,
        6,
        6.5,
        7,
    ];

    const verticalTrialPoints =
        verticalTrialDepths.map(
            (depth, index) => ({
                [`DEPTH_${String(depth).replace(".", "_")}`]: {
                    x: P2_EASE_POINT.x,
                    y:
                        P2_EASE_POINT.y +
                        toPx(depth),
                },
            })
        ).reduce(
            (acc, item) => ({
                ...acc,
                ...item,
            }),
            {}
        );

// =========================================================

const E = P2_EASE_POINT;

// Handle lengths (shape tuning)
const ARM_E_HANDLE = 0.6;   // vertical handle at E   (0.4 – 0.8)
const ARM_A2_HANDLE = 0.5;  // handle at A2           (0.3 – 0.7)
const ARM_P3_HANDLE = 0.5;  // flattening into P3     (0.3 – 0.7)

const armholeTargetLength = armholeNum / 2;
const armholeTargetPx = toPx(armholeTargetLength);

const chestTargetWidth = chestNum / 4;
const targetP3X = A.x + toPx(chestTargetWidth);

const A2_DISTANCE = chestNum / 25;
const angleBisectorDistance = toPx(A2_DISTANCE);
const diagonalOffset = angleBisectorDistance / Math.sqrt(2);

const buildArmhole = (depthInches) => {
    const P3 = {
        x: targetP3X,
        y: E.y + toPx(depthInches),
    };

    const A1 = { x: E.x, y: P3.y };

    const A2 = {
        x: A1.x + diagonalOffset,
        y: A1.y - diagonalOffset,
    };

    // Segment 1: E → A2 (leaves E straight down)
    const seg1 = {
        p0: E,
        p1: A2,
        c1: { x: E.x, y: E.y + (A2.y - E.y) * ARM_E_HANDLE },
        c2: {
            x: A2.x - diagonalOffset * ARM_A2_HANDLE,
            y: A2.y - diagonalOffset * ARM_A2_HANDLE,
        },
    };

    // Segment 2: A2 → P3 (mirrored handle at A2, flat into P3)
    const seg2 = {
        p0: A2,
        p1: P3,
        c1: {
            x: A2.x + diagonalOffset * ARM_A2_HANDLE,
            y: A2.y + diagonalOffset * ARM_A2_HANDLE,
        },
        c2: {
            x: P3.x - (P3.x - A2.x) * ARM_P3_HANDLE,
            y: P3.y,
        },
    };

    const length =
        cubicBezierLength(seg1.p0, seg1.c1, seg1.c2, seg1.p1) +
        cubicBezierLength(seg2.p0, seg2.c1, seg2.c2, seg2.p1);

    return { P3, A1, A2, seg1, seg2, length, depth: depthInches };
};

const solveArmholeByChestAndDepth = () => {
    let low = diagonalOffset / scale + 0.1; // A2 must stay below E
    let high = 20;
    let best = buildArmhole(high);

    for (let iter = 0; iter < 60; iter++) {
        const mid = (low + high) / 2;
        const candidate = buildArmhole(mid);
        best = candidate;

        if (candidate.length < armholeTargetPx) {
            low = mid;
        } else {
            high = mid;
        }
    }
    return best;
};

const armholeSolved = solveArmholeByChestAndDepth();

const P3 = armholeSolved.P3;
const A1 = armholeSolved.A1;
const A2 = armholeSolved.A2;

// Keep the names used further down
const p2ToP3Solved = {
    end: P3,
    control1: armholeSolved.seg1.c1,
    control2: armholeSolved.seg1.c2,
    depth: armholeSolved.depth,
    horizontal: (P3.x - A.x) / scale,
};

// Still returned in `calculations`
const hypotenuseLength = Math.hypot(P3.x - E.x, P3.y - E.y);


// I updated these code before this line 





    // =========================================================
    // CHEST / 4 REFERENCE
    // =========================================================
    //
    // Horizontal measurement from A's vertical line to P3.
    //
    // =========================================================

    const CHEST_P3_REFERENCE = {
        x: P3.x,
        y: P3.y,
    };
    const CHEST_P3_START = {
        x: A.x,
        y: P3.y,
    };
    const p2ToP3Control1 =
        p2ToP3Solved.control1;

    const p2ToP3Control2 =
        p2ToP3Solved.control2;

    const p2ToP3Horizontal =
        p2ToP3Solved.horizontal;

    const p2ToP3Vertical =
        p2ToP3Solved.depth;

    const p2ToP3Curve = `
    M ${P2_EASE_POINT.x} ${P2_EASE_POINT.y}
    C
      ${p2ToP3Control1.x} ${p2ToP3Control1.y},
      ${p2ToP3Control2.x} ${p2ToP3Control2.y},
      ${P3.x} ${P3.y}
  `;

    const eToP3Curve = `
    M ${E.x} ${E.y}
    Q ${2 * A2.x - (E.x + P3.x) / 2}
      ${2 * A2.y - (E.y + P3.y) / 2}
      ${P3.x} ${P3.y}
`;

// =========================================================
// S – FRONT NECK: S sits (PK - 1") from the A line,
// i.e. 1" left of the P1 vertical line
// =========================================================

const FRONT_NECK_PK_REDUCTION = 1;

const S_FROM_A = p1Distance - FRONT_NECK_PK_REDUCTION;

const straightLength =
    backNeckDesignLengthNum -
    STRAIGHT_OFFSET;

const S = {
    x: A.x + toPx(S_FROM_A),
    y: P1.y + toPx(straightLength),
};



    // =========================================================
    // D
    // =========================================================

    const totalNeckHeight =
        NECK_TOP_EXTRA +
        backLengthNum +
        NECK_BOTTOM_EXTRA;

    const D = {
        x: A.x,
        y:
            A.y +
            toPx(totalNeckHeight),
    };

    // =========================================================
    // C
    // =========================================================

    const C = {
        x: A.x,

        y:
            B.y +
            toPx(backLengthNum),
    };

    const frontNeckMarkDistance =
        (backLengthNum - Number(fNeck)) / 2;

    const FN1 = {
        x: C.x,
        y: C.y - toPx(frontNeckMarkDistance),
    };




    // =========================================================
    // LEFT-SIDE STITCHING EASE LINE (H, H1, H2)
    // =========================================================
    //
    // A dotted vertical guide line, 0.5" to the left of the
    // A / P4 / C / D column, running from A's height down to
    // D's height:
    //
    //   A
    //   B
    //   |
    //   H  ------- P4
    //   |
    //   H1 ------- C
    //   |
    //   H2 ------- D
    //
    // H is measured 0.5" left of P4 (same x as A). The line
    // itself is purely a construction/ease reference — it does
    // not change the solid stitching path.
    //
    // =========================================================

    const easeLineX =
        A.x - toPx(P4_LEFT_EASE);

    const H = {
        x: easeLineX,
        y: P4.y,
    };

    const H1 = {
        x: easeLineX,
        y: C.y,
    };

    const H2 = {
        x: easeLineX,
        y: D.y,
    };

    // =========================================================
    // P6
    // =========================================================

    const dToP6 =
        hipNum / 4 +
        P6_EASE;

    const P6 = {
        x:
            D.x +
            toPx(dToP6),

        y: D.y,
    };

    // =========================================================
    // P7
    // =========================================================

    const P7 = {
        x:
            P6.x +
            toPx(P7_EXTENSION),

        y: P6.y,
    };


    const P9_DISTANCE = 3;
    const P10_DISTANCE = 0.5;

    const P9 = {
        x: P7.x + P9_DISTANCE * scale,
        y: P7.y,
    };

    const P10 = {
        x: P9.x + P10_DISTANCE * scale,
        y: P7.y,
    };

    // =========================================================
    // FN1 → FN2
    // FN2 is the point where the diagonal starting from FN1
    // meets the horizontal D → P10 line.
    //
    // Therefore:
    // FN2.y = D.y
    // =========================================================

    const fn1ToFn2DeltaY = D.y - FN1.y;

    const FN2 = {
        x: FN1.x + fn1ToFn2DeltaY,
        y: D.y,
    };


    // =========================================================
    // P8
    // =========================================================

    const P8 = {
        x:
            P3.x +
            toPx(P8_EXTENSION),

        y: P3.y,
    };



    // =========================================================
    // FN1 → P8/P10 CONNECTING LINE
    // =========================================================
    //
    // Find where the horizontal line from FN1 intersects
    // the P8 → P10 diagonal line.
    //
    // =========================================================

    const p8ToP10Dx = P10.x - P8.x;
    const p8ToP10Dy = P10.y - P8.y;

    // Horizontal level of FN1
    const fn1Y = FN1.y;

    // Calculate the intersection X
    const fn1ToP8P10Ratio =
        (fn1Y - P8.y) / p8ToP10Dy;

    const FN1_P8_P10_INTERSECTION = {
        x:
            P8.x +
            p8ToP10Dx * fn1ToP8P10Ratio,

        y: fn1Y,
    };

    // =========================================================
    // P1 → S
    // =========================================================

    const p1ToS = `
      M ${P1.x} ${P1.y}
      L ${S.x} ${S.y}
    `;

// =========================================================
// FRONT NECK CURVE  S → P4
// Leaves S along the P1 → S direction (no kink),
// arrives at P4 horizontally.
// =========================================================

const FN_HANDLE_S = 0.5;   // handle length at S   (0.3 – 0.7)
const FN_HANDLE_P4 = 0.6;  // handle length at P4  (0.3 – 0.8)

const p1ToSLen = Math.hypot(S.x - P1.x, S.y - P1.y) || 1;
const dirX = (S.x - P1.x) / p1ToSLen;
const dirY = (S.y - P1.y) / p1ToSLen;

const sToP4Len = Math.hypot(P4.x - S.x, P4.y - S.y);

const backNeckControl1 = {
    x: S.x + dirX * sToP4Len * FN_HANDLE_S,
    y: S.y + dirY * sToP4Len * FN_HANDLE_S,
};

const backNeckControl2 = {
    x: P4.x + (S.x - P4.x) * FN_HANDLE_P4,
    y: P4.y,
};

const backNeckCurve = `
  M ${S.x} ${S.y}
  C
    ${backNeckControl1.x} ${backNeckControl1.y},
    ${backNeckControl2.x} ${backNeckControl2.y},
    ${P4.x} ${P4.y}
`;

    // =========================================================
    // P3 → P8
    // =========================================================

    const p3ToP8Curve = `
  M ${P3.x} ${P3.y}
  L ${P8.x} ${P8.y}
`;

    // =========================================================
    // ARMHOLE CURVE: E → A2 → P3 → P8
    // =========================================================
    // Forward direction (E → A2 → P3 → P8)
    // flattenPointIndex: 2 means P3, so the tangent at P3
    // is blended 60% toward horizontal in both directions.
// =========================================================
// ARMHOLE PATH: E → A2 → P3 → P8
// =========================================================

const segmentsToPath = (segments) => {
    let d = `M ${segments[0].p0.x} ${segments[0].p0.y}`;
    segments.forEach((s) => {
        d += ` C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.p1.x} ${s.p1.y}`;
    });
    return d;
};

const segmentsToReversePath = (segments) => {
    const last = segments[segments.length - 1];
    let d = `M ${last.p1.x} ${last.p1.y}`;
    for (let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i];
        d += ` C ${s.c2.x} ${s.c2.y}, ${s.c1.x} ${s.c1.y}, ${s.p0.x} ${s.p0.y}`;
    }
    return d;
};

const armholeSegments = [armholeSolved.seg1, armholeSolved.seg2];

// Forward: E → A2 → P3 → P8  (used by the P3_to_P8 guide)
const eA2P3P8Curve =
    segmentsToPath(armholeSegments) + ` L ${P8.x} ${P8.y}`;

// Reverse: P8 → P3 → A2 → E  (used inside the main path)
const reverseEA2P3P8Curve =
    `M ${P8.x} ${P8.y} L ${P3.x} ${P3.y}` +
    segmentsToReversePath(armholeSegments).replace(/^M [^C]*/, " ");
    // =========================================================
    // MAIN PATTERN PATH
    // =========================================================

    // =========================================================
    // MAIN PATTERN PATH
    // =========================================================

const path = `
  M ${P1.x} ${P1.y}

  L ${S.x} ${S.y}

  C
    ${backNeckControl1.x} ${backNeckControl1.y},
    ${backNeckControl2.x} ${backNeckControl2.y},
    ${P4.x} ${P4.y}

  L ${D.x} ${D.y}

  L ${P6.x} ${P6.y}

  L ${P7.x} ${P7.y}

  ${reverseEA2P3P8Curve.replace(/^M /, "L ")}

  L ${P2.x} ${P2.y}

  L ${P1.x} ${P1.y}

  Z
`.trim();
    // =========================================================
    // GUIDES
    // =========================================================

    const RIGHT_ANGLE_SIZE = toPx(0.25);

    const guides = {

        // A → P1
        A_to_P1: `
        M ${A.x} ${A.y}
        L ${P1.x} ${P1.y}
      `,

        // P1 → P2
        P1_to_P2: `
        M ${P1.x} ${P1.y}
        L ${P2.x} ${P2.y}
      `,

        // P2 → P3 construction reference
        //
        // IMPORTANT:
        // The vertical section now visually reaches
        // the P3 level calculated using the B reference.
        //
//         P2_to_P3: `
//     M ${P2.x} ${P2.y}
//     L ${P2_EASE_POINT.x} ${P2_EASE_POINT.y}
//     L ${P3.x} ${P3.y}
//   `,

        // A → P4
        A_to_P4: `
        M ${A.x} ${A.y}
        L ${P4.x} ${P4.y}
      `,

        // P1 → S → P4
        P1_to_P4: `
        M ${P1.x} ${P1.y}
        L ${S.x} ${S.y}
        L ${P4.x} ${P4.y}
      `,

        // A → D
        A_to_D: `
        M ${A.x} ${A.y}
        L ${D.x} ${D.y}
      `,

        // D → P6
        D_to_P6: `
        M ${D.x} ${D.y}
        L ${P6.x} ${P6.y}
      `,

        // P6 → P7
        P6_to_P7: `
        M ${P6.x} ${P6.y}
        L ${P7.x} ${P7.y}
      `,

        // P3 → P8
        P3_to_P8:
            eA2P3P8Curve,

        // P8 → P7
        P8_to_P7: `
        M ${P8.x} ${P8.y}
        L ${P7.x} ${P7.y}
      `,

        // P3 → P6
        P3_to_P6: `
        M ${P3.x} ${P3.y}
        L ${P6.x} ${P6.y}
      `,

        // A → B
        A_to_B: `
        M ${A.x} ${A.y}
        L ${B.x} ${B.y}
      `,

        // C → D
        C_to_D: `
        M ${C.x} ${C.y}
        L ${D.x} ${D.y}
      `,

        // B → P2
        //
        // IMPORTANT:
        // This is now the horizontal reference
        // used by the armhole calculation.
        //
        B_to_P2_EASE: `
        M ${B.x} ${B.y}
        L ${P2.x} ${B.y}
      `,

        // C → P7
        C_to_P7_EASE: `
        M ${C.x} ${C.y}
        L ${P7.x} ${C.y}
      `,

        // D → P7
        D_to_P7_EASE: `
        M ${D.x} ${D.y}
        L ${P7.x} ${D.y}
      `,
        // P2 → 0.5" vertical ease point
        P2_to_EASE_POINT: `
        M ${P2.x} ${P2.y}
        L ${P2_EASE_POINT.x} ${P2_EASE_POINT.y}
      `,

        Chest_to_P3: `
  M ${CHEST_P3_START.x} ${CHEST_P3_START.y}
  L ${CHEST_P3_REFERENCE.x} ${CHEST_P3_REFERENCE.y}

`,
        E_to_P3_Depth: `
  M ${P2_EASE_POINT.x} ${P2_EASE_POINT.y}
  L ${P2_EASE_POINT.x} ${P3.y}
`,

        // -------------------------------------------------------
        // LEFT-SIDE STITCHING EASE LINE (dotted)
        // -------------------------------------------------------

        // Vertical dotted line, A's height → D's height,
        // 0.5" to the left of the A/P4/C/D column
        A_to_D_EASE_LINE: `
  M ${easeLineX} ${A.y}
  L ${easeLineX} ${D.y}
`,

        // Horizontal ties from the ease line back to the
        // actual pattern points, for reference
        H_to_P4: `
  M ${H.x} ${H.y}
  L ${P4.x} ${P4.y}
`,
        H1_to_C: `
  M ${H1.x} ${H1.y}
  L ${C.x} ${C.y}
`,
        H2_to_D: `
  M ${H2.x} ${H2.y}
  L ${D.x} ${D.y}
`,
        P7_to_P9: `
    M ${P7.x} ${P7.y}
    L ${P9.x} ${P9.y}
`,

        P9_to_P10: `
    M ${P9.x} ${P9.y}
    L ${P10.x} ${P10.y}
`,
        P8_to_P9: `
    M ${P8.x} ${P8.y}
    L ${P9.x} ${P9.y}
`,

        P8_to_P10: `
    M ${P8.x} ${P8.y}
    L ${P10.x} ${P10.y}
`,
        C_to_FN1: `
    M ${C.x} ${C.y}
    L ${FN1.x} ${FN1.y}
`,
        FN1_horizontal_reference: ` M ${FN1.x} ${FN1.y} L ${P8.x} ${FN1.y} `,
        FN1_to_P8_P10: `
    M ${FN1.x} ${FN1.y}
    L ${FN1_P8_P10_INTERSECTION.x}
      ${FN1_P8_P10_INTERSECTION.y}
`,
        FN1_to_FN2: `
    M ${FN1.x} ${FN1.y}
    L ${FN2.x} ${FN2.y}
`,
        FN2_to_I: `
    M ${FN2.x} ${FN2.y}
    L ${FN1_P8_P10_INTERSECTION.x}
      ${FN1_P8_P10_INTERSECTION.y}
`,
        // =======================================================
        // E → A1
        // =======================================================

        E_to_A1: `
    M ${E.x} ${E.y}
    L ${A1.x} ${A1.y}
`,

        // =======================================================
        // A1 → P3
        // =======================================================

        A1_to_P3: `
    M ${A1.x} ${A1.y}
    L ${P3.x} ${P3.y}
`,

        // =======================================================
        // E → P3 HYPOTENUSE
        // =======================================================

        // E_to_P3: `
        //     M ${E.x} ${E.y}
        //     Q ${2 * A2.x - (E.x + P3.x) / 2}
        //       ${2 * A2.y - (E.y + P3.y) / 2}
        //       ${P3.x} ${P3.y}
        // `,

        // =======================================================
        // A1 → A2 (1.5" from A1, toward the E → P3 slope)
        // =======================================================

        A1_to_A2: `
    M ${A1.x} ${A1.y}
    L ${A2.x} ${A2.y}
`,

        // =======================================================
        // 90° RIGHT-ANGLE MARKER AT A1
        // =======================================================


        A1_RIGHT_ANGLE: `
    M ${A1.x}
      ${A1.y - RIGHT_ANGLE_SIZE}

    L ${A1.x + RIGHT_ANGLE_SIZE}
      ${A1.y - RIGHT_ANGLE_SIZE}

    L ${A1.x + RIGHT_ANGLE_SIZE}
      ${A1.y}
`,
    };

    // =========================================================
    // POINTER DEFINITIONS
    // =========================================================

    const pointers = [

        {
            id: "A_TO_P1",
            from: "A",
            to: "P1",
            measurement: p1Distance,
            measurementName:
                "Pakka Kazhuthu / 2",
            color: COLORS.A_P1,
            type: "line",
        },

        {
            id: "P1_TO_P2",
            from: "P1",
            to: "P2",
            measurement: p1ToP2,
            measurementName:
                "Shoulder + 0.75",
            color: COLORS.P1_P2,
            type: "line",
        },

        {
            id: "P2_TO_P3_ARMHOLE",
            from: "P2_EASE_POINT",
            to: "P3",
            measurement: armholeNum / 2,
            measurementName: "Armhole / 2 (curve length)",
            color: COLORS.P2_P3_ARMHOLE,
            type: "curve",

            // Reference line from B to P2
            referenceFrom: "B",
            referenceTo: "P2",
            referenceGuide: "B_to_P2_EASE",
            referenceStyle: "dotted",
        },

        {
            id: "P1_TO_S",
            from: "P1",
            to: "S",
            measurement:
                straightLength,
            measurementName:
                `Straight drop (Design Neck - ${STRAIGHT_OFFSET}")`,
            color:
                COLORS.P1_P4,
            type: "vertical",
        },

        {
            id: "S_TO_P4",
            from: "S",
            to: "P4",
            measurement:
                backNeckDesignLengthNum -
                straightLength,
            measurementName:
                "Back neck curve",
            color:
                COLORS.P1_P4,
            type: "curve",
        },

        {
            id: "A_TO_P4",
            from: "A",
            to: "P4",
            measurement:
                backNeckDesignLengthNum,
            measurementName:
                "Design Neck Length",
            color:
                COLORS.A_P4,
            type: "vertical",
        },

        {
            id: "A_TO_D",
            from: "A",
            to: "D",
            measurement:
                totalNeckHeight,
            measurementName:
                "Total Neck Height",
            color:
                COLORS.A_D,
            type: "vertical",
        },

        {
            id: "D_TO_P6",
            from: "D",
            to: "P6",
            measurement:
                dToP6,
            measurementName:
                "Bottom Width",
            color:
                COLORS.D_P6,
            type: "horizontal",
        },

        {
            id: "P6_TO_P7",
            from: "P6",
            to: "P7",
            measurement:
                P7_EXTENSION,
            measurementName:
                "Bottom Extension",
            color:
                COLORS.P6_P7,
            type: "horizontal",
        },

        {
            id: "P3_TO_P8",
            from: "P3",
            to: "P8",
            measurement:
                P8_EXTENSION,
            measurementName:
                "Curve Extension",
            color:
                COLORS.P3_P8,
            type: "line",
        },

        {
            id: "P8_TO_P7",
            from: "P8",
            to: "P7",
            measurement: null,
            measurementName:
                "Side Connection",
            color:
                COLORS.P8_P7,
            type: "line",
        },

        {
            id: "P3_TO_P6",
            from: "P3",
            to: "P6",
            measurement: null,
            measurementName:
                "Construction Line",
            color:
                COLORS.P3_P6,
            type: "construction",
        },
        {
            id: "P2_VERTICAL_EASE",
            from: "P2",
            to: "P2_EASE_POINT",
            measurement: NECK_TOP_EXTRA,
            measurementName: "Vertical Ease",
            color: COLORS.A_D,
            type: "vertical",
        },
        {
            id: "E_TO_P3_DEPTH",
            from: "P2_EASE_POINT",
            to: "CHEST_P3_START",
            measurement: p2ToP3Vertical,
            measurementName: `Armhole Depth ${p2ToP3Vertical.toFixed(2)}"`,
            color: COLORS.P2_P3_ARMHOLE,
            type: "vertical",
        },
        {
            id: "P2_TO_DEPTH_5",
            from: "P2_EASE_POINT",
            to: "DEPTH_5",
            measurement: 5,
            measurementName: "Armhole Depth Trial - 5",
            color: COLORS.P2_P3_ARMHOLE,
            type: "vertical",
        },

        {
            id: "P2_TO_DEPTH_5_5",
            from: "P2_EASE_POINT",
            to: "DEPTH_5_5",
            measurement: 5.5,
            measurementName: "Armhole Depth Trial - 5.5",
            color: COLORS.P2_P3_ARMHOLE,
            type: "vertical",
        },

        {
            id: "P2_TO_DEPTH_6",
            from: "P2_EASE_POINT",
            to: "DEPTH_6",
            measurement: 6,
            measurementName: "Armhole Depth Trial - 6",
            color: COLORS.P2_P3_ARMHOLE,
            type: "vertical",
        },

        {
            id: "P2_TO_DEPTH_6_5",
            from: "P2_EASE_POINT",
            to: "DEPTH_6_5",
            measurement: 6.5,
            measurementName: "Armhole Depth Trial - 6.5",
            color: COLORS.P2_P3_ARMHOLE,
            type: "vertical",
        },

        {
            id: "P2_TO_DEPTH_7",
            from: "P2_EASE_POINT",
            to: "DEPTH_7",
            measurement: 7,
            measurementName: "Armhole Depth Trial - 7",
            color: COLORS.P2_P3_ARMHOLE,
            type: "vertical",
        },
        {
            id: "CHEST_TO_P3",
            from: "CHEST_P3_START",
            to: "CHEST_P3_REFERENCE",
            measurement: chestNum / 4,
            measurementName: "Chest / 4",
            color: COLORS.P2_P3_CHEST,
            type: "horizontal",
        },

        // -------------------------------------------------------
        // LEFT-SIDE STITCHING EASE (0.5")
        // -------------------------------------------------------
        {
            id: "H_TO_P4",
            from: "H",
            to: "P4",
            measurement: P4_LEFT_EASE,
            measurementName: `Left Stitching Ease ${P4_LEFT_EASE}"`,
            color: COLORS.EASE_LINE,
            type: "horizontal",
        },
        {
            id: "P7_TO_P9",
            from: "P7",
            to: "P9",
            measurement: P9_DISTANCE,
            measurementName: "P7 to P9",
            color: COLORS.P6_P7,
            type: "horizontal",
        },

        {
            id: "P9_TO_P10",
            from: "P9",
            to: "P10",
            measurement: P10_DISTANCE,
            measurementName: "P9 to P10",
            color: COLORS.P6_P7,
            type: "horizontal",
        },
        {
            id: "P8_TO_P9",
            from: "P8",
            to: "P9",
            measurement: null,
            measurementName: "P8 to P9",
            color: COLORS.P8_P7,
            type: "line",
        },

        {
            id: "P8_TO_P10",
            from: "P8",
            to: "P10",
            measurement: null,
            measurementName: "P8 to P10",
            color: COLORS.P8_P7,
            type: "line",
        },
        {
            id: "C_TO_FN1",
            from: "C",
            to: "FN1",
            measurement: frontNeckMarkDistance,
            measurementName:
                "Total Front Neck Length - Neck Design / 2",
            color: COLORS.A_D,
            type: "vertical",
        },
        {
            id: "FN2_TO_I",
            from: "FN2",
            to: "FN1_P8_P10_INTERSECTION",
            measurement: null,
            measurementName: "FN2 to I",
            color: COLORS.A_D,
            type: "line",
        },
        {
            id: "E_TO_A2",
            from: "A1",
            to: "A2",
            measurement: A2_DISTANCE,
            measurementName:
                `A1 to A2 (${A2_DISTANCE}")`,
            color: "#F59E0B",
            type: "line",
        },
    ];

    // =========================================================
    // POINT STYLES
    // =========================================================

const pointStyles = {
    A:  { color: COLORS.A,  radius: 2 },
    B:  { color: COLORS.A_D, radius: 2 },   // <-- ADDED
    C:  { color: COLORS.A_D, radius: 2 },   // <-- ADDED

    E:  { color: COLORS.A_D, radius: 2 },   // <-- ADDED (alias for P2_EASE_POINT)

    P1: { color: COLORS.P1, radius: 2 },
    P2: { color: COLORS.P2, radius: 2 },
    P3: { color: COLORS.P3, radius: 2 },
    P4: { color: COLORS.P4, radius: 2 },
    D:  { color: COLORS.D,  radius: 2 },
    P6: { color: COLORS.P6, radius: 2 },
    P7: { color: COLORS.P7, radius: 2 },
    P8: { color: COLORS.P8, radius: 2 },
    P9:  { color: COLORS.P6_P7, radius: 2 },  // <-- ADDED
    P10: { color: COLORS.P6_P7, radius: 2 },  // <-- ADDED
    S:  { color: COLORS.S,  radius: 2 },

    SE: { color: COLORS.P1_P2, radius: 2 },  // <-- ADDED

    P2_EASE_POINT: { color: COLORS.A_D, radius: 2 },

    H:  { color: COLORS.H, radius: 2 },
    H1: { color: COLORS.H, radius: 2 },
    H2: { color: COLORS.H, radius: 2 },

    FN1: { color: COLORS.A_D, radius: 2 },
    FN2: { color: COLORS.A_D, radius: 2 },

    FN1_P8_P10_INTERSECTION: { color: COLORS.A_D, radius: 2 },

    A1: { color: "#16A34A", radius: 2 },
    A2: { color: "#F59E0B", radius: 2 },
};

    // =========================================================
    // POINT LABELS
    // =========================================================

    const pointLabels = {
        A: {
            text: "A",
            color: COLORS.A,
        },

        P1: {
            text: "P1",
            color: COLORS.P1,
        },

        P2: {
            text: "P2",
            color: COLORS.P2,
        },

        P3: {
            text: "P3",
            color: COLORS.P3,
        },

        P4: {
            text: "P4",
            color: COLORS.P4,
        },

        D: {
            text: "D",
            color: COLORS.D,
        },

        P6: {
            text: "P6",
            color: COLORS.P6,
        },

        P7: {
            text: "P7",
            color: COLORS.P7,
        },

        P8: {
            text: "P8",
            color: COLORS.P8,
        },

        S: {
            text: "S",
            color: COLORS.S,
        },
        P2_EASE_POINT: {
            text: "E",
            color: COLORS.A_D,
        },

        H: {
            text: "H",
            color: COLORS.H,
        },
        H1: {
            text: "H1",
            color: COLORS.H,
        },
        H2: {
            text: "H2",
            color: COLORS.H,
        },
        FN1: {
            text: "FN1",
            color: COLORS.A_D,
        },
        FN1_P8_P10_INTERSECTION: {
            text: "I",
            color: COLORS.A_D,
        },
        A1: {
            text: "A1",
            color: "#16A34A",
        },

        A2: {
            text: "A2",
            color: "#F59E0B",
        },
    };

    // =========================================================
    // GUIDE COLORS
    // =========================================================

    const guideColors = {

        A_to_P1:
            COLORS.A_P1,

        P1_to_P2:
            COLORS.P1_P2,

        // P2_to_P3:
        //     COLORS.P2_P3_CHEST,

        A_to_P4:
            COLORS.A_P4,

        P1_to_P4:
            COLORS.P1_P4,

        A_to_D:
            COLORS.A_D,

        D_to_P6:
            COLORS.D_P6,

        P6_to_P7:
            COLORS.P6_P7,

        P3_to_P8:
            COLORS.P3_P8,

        P8_to_P7:
            COLORS.P8_P7,

        P3_to_P6:
            COLORS.P3_P6,

        A_to_B:
            COLORS.A_D,

        C_to_D:
            COLORS.A_D,

        B_to_P2_EASE:
            COLORS.A_D,

        C_to_P7_EASE:
            COLORS.A_D,

        D_to_P7_EASE:
            COLORS.A_D,
        Chest_to_P3:
            COLORS.P2_P3_CHEST,

        E_to_P3_Depth:
            COLORS.P2_P3_ARMHOLE,

        A_to_D_EASE_LINE:
            COLORS.EASE_LINE,
        H_to_P4:
            COLORS.EASE_LINE,
        H1_to_C:
            COLORS.EASE_LINE,
        H2_to_D:
            COLORS.EASE_LINE,
        P7_to_P9: COLORS.P6_P7,
        P9_to_P10: COLORS.P6_P7,
        P8_to_P9: COLORS.P8_P7,
        P8_to_P10: COLORS.P8_P7,
        C_to_FN1: COLORS.A_D,
        FN1_horizontal_reference: COLORS.A_D,
        FN1_to_P8_P10: COLORS.A_D,
        FN1_to_FN2: COLORS.A_D,
        FN2_to_I: COLORS.A_D,
        E_to_A1: "#2563EB",

        A1_to_P3: "#16A34A",

        // E_to_P3: "#DC2626",
        // A1_to_A2: "#F59E0B",
        A1_RIGHT_ANGLE: "#111827",
    };

    // =========================================================
    // LABELS
    // =========================================================

    const labels = [

        {
            id: "LABEL_A_P1",
            text: `${p1Distance}" P K`,
            x:
                (A.x + P1.x) / 2,
            y:
                A.y - 14,
            color:
                COLORS.A_P1,
        },

        {
            id: "LABEL_P1_P2",
            text: `${p1ToP2}" Shoul`,
            x:
                (P1.x + P2.x) / 2,
            y:
                P1.y - 14,
            color:
                COLORS.P1_P2,
        },

        {
            id: "LABEL_B_P4",
            text:
                `${fNeck}" Design Neck Length`,
            x:
                P4.x - 25,
            y:
                (A.y + P4.y) / 2,
            color:
                COLORS.A_P4,
        },

        {
            id: "LABEL_P1_S",
            x:
                P1.x + 20,
            y:
                (P1.y + S.y) / 2,
            color:
                COLORS.P1_P4,
        },

        {
            id: "LABEL_S_P4",
            text: "",
            x:
                (S.x + P4.x) / 2 + 20,
            y:
                (S.y + P4.y) / 2 - 10,
            color:
                COLORS.P1_P4,
        },

        {
            id: "LABEL_A_D",
            text:
                `${totalNeckHeight}" Total Neck Height`,
            x:
                A.x - 25,
            y:
                (A.y + D.y) / 2,
            color:
                COLORS.A_D,
        },

        {
            id: "LABEL_D_P6",
            text:
                `${dToP6}" Hip Width`,
            x:
                (D.x + P6.x) / 2,
            y:
                D.y + 25,
            color:
                COLORS.D_P6,
        },

        {
            id: "LABEL_P6_P7",
            text:
                `${P7_EXTENSION}"`,
            x:
                (P6.x + P7.x) / 2,
            y:
                P6.y + 25,
            color:
                COLORS.P6_P7,
        },

        {
            id: "LABEL_P3_P8",
            text:
                `${P8_EXTENSION}"`,
            x:
                (P3.x + P8.x) / 2,
            y:
                P8.y + 25,
            color:
                COLORS.P3_P8,
        },

        // A → B
        {
            id: "LABEL_A_B",
            text:
                `${NECK_TOP_EXTRA}"`,
            x:
                A.x - 35,
            y:
                (A.y + B.y) / 2,
            color:
                COLORS.A_D,
        },

        // C → D
        {
            id: "LABEL_C_D",
            text:
                `${NECK_BOTTOM_EXTRA}"`,
            x:
                A.x - 35,
            y:
                (C.y + D.y) / 2,
            color:
                COLORS.A_D,
        },

        // Shoulder ease
        {
            id: "LABEL_SHOULDER_EASE",
            x:
                SE.x + 10,
            y:
                SE.y + toPx(3),
            color:
                COLORS.P1_P2,
        },

        // H → P4 left stitching ease
        {
            id: "LABEL_H_P4",
            text:
                `${P4_LEFT_EASE}" Ease`,
            x:
                (H.x + P4.x) / 2,
            y:
                H.y - 10,
            color:
                COLORS.EASE_LINE,
        },
        {
            text: "FN2",
            color: COLORS.A_D,
        },
    ];

    // =========================================================
    // RETURN
    // =========================================================

    return {

        // MAIN SHAPE
        path,

        // GUIDES
        guides,

        // GUIDE COLORS
        guideColors,

        // POINTERS
        pointers,

        // POINT STYLES
        pointStyles,

        // COLORS
        colors: COLORS,

        // POINT LABELS
        pointLabels,

        // POINT COORDINATES
        points: {
            A,
            B,
            C,
            E,
            A1,A2,
            FN1,
            FN2,
            FN1_P8_P10_INTERSECTION,
            P1,
            SE,
            P2,
            P2_EASE_POINT,
            P3,
            P4,
            D,
            P6,
            P7,
            P9,
            P10,
            P8,
            S,
            H,
            H1,
            H2,
        },



        // LABELS
        labels,

        // POSITION
        x: offsetX,
        y: offsetY,

        // SIZE
        width:
            Math.max(
                P7.x - offsetX,
                P8.x - offsetX,
                P2.x - offsetX
            ),

        height:
            toPx(totalNeckHeight),

        // ORIGINAL MEASUREMENTS
        measurements: {
            hip: hipNum,
            armhole: armholeNum,
            backLength: backLengthNum,
            chest: chestNum,
            backNeckDesignLength:
                backNeckDesignLengthNum,
            shoulder: shoulderNum,
            pakkaKazhuthu:
                pakkaKazhuthuNum,
        },

        // CALCULATIONS
        calculations: {

            shoulderExtra:
                SHOULDER_EXTRA,

            neckTopExtra:
                NECK_TOP_EXTRA,

            neckBottomExtra:
                NECK_BOTTOM_EXTRA,

            p1Distance,

            p1ToP2,

            // -----------------------------------------------------
            // ARMHOLE
            // -----------------------------------------------------

            armholeCurveTargetLength:
                armholeNum / 2,

            armholeReferenceOffset:
                NECK_TOP_EXTRA,

            armholeReference:
                "B_to_P2",

            p2ToP3Horizontal,

            p2ToP3Vertical,

            // -----------------------------------------------------
            // BOTTOM
            // -----------------------------------------------------

            p6Ease:
                P6_EASE,

            dToP6,

            p7Extension:
                P7_EXTENSION,

            p8Extension:
                P8_EXTENSION,

            // -----------------------------------------------------
            // HEIGHT
            // -----------------------------------------------------

            totalNeckHeight,

            // -----------------------------------------------------
            // BACK NECK
            // -----------------------------------------------------

            designNeckLength:
                backNeckDesignLengthNum,

            straightDrop:
                straightLength,

            backNeckHorizontalInfluence:
                0.375 *
                pakkaKazhuthuNum,

            backNeckVerticalInfluenceFactor:
                VERTICAL_INFLUENCE_FACTOR,

            // -----------------------------------------------------
            // LEFT-SIDE STITCHING EASE
            // -----------------------------------------------------

            p4LeftEase:
                P4_LEFT_EASE,
            // -----------------------------------------------------
            // ARMHOLE RIGHT-ANGLE TRIANGLE
            // -----------------------------------------------------

            hypotenuseLength:
                hypotenuseLength / scale,

            a1: {
                x: A1.x,
                y: A1.y,
            },

            a2: {
                x: A2.x,
                y: A2.y,
            },

            a2Distance:
                A2_DISTANCE,

            a2MeasuredFrom:
                "A1",
        },
    };
};