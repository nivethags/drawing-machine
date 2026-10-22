import { generateSleevePattern } from "./sleeveCalculation";



export function generateBlousePattern(measurements) {

    const MM = 25.4;
    const START_X = 20;
    const START_Y = 20;

    const bust = measurements.bust * MM;
    const waist = measurements.waist * MM;
    const shoulder = measurements.shoulder * MM;
    const length = measurements.blouseLength * MM;
    const frontNeckDepth = measurements.frontNeckDepth * MM;
    const sleeveLength = measurements.sleeveLength * MM;
    const sleeveRound = measurements.sleeveRound * MM;

    // <-- REMOVED from here, no longer needed at the top

    const front = {
        x: START_X,
        y: START_Y,
        width: bust / 4,
        height: length,
        neckWidth: 76,
        neckDepth: frontNeckDepth,
        shoulderLength: shoulder / 2 - 10,
        shoulderDrop: 12,
        armholeDepth: bust / 4 + 25,
        waistWidth: waist / 4,
        sleeveLength,
        sleeveRound
    };

    front.points = {
        A: { x: front.x, y: front.y },
        B: { x: front.x + front.neckWidth, y: front.y },
        C: { x: front.x + front.neckWidth + front.shoulderLength, y: front.y + front.shoulderDrop },
        D: { x: front.x, y: front.y + front.armholeDepth },
        E: { x: front.x + front.width, y: front.y },
        F: { x: front.x + front.width, y: front.y + front.height },
        G: { x: front.x, y: front.y + front.height },
        H: { x: front.x + front.width - 35, y: front.y + front.armholeDepth },
        I: { x: front.x + front.waistWidth, y: front.y + front.height },
    };

    const back = {
        x: front.x + front.width + 100,
        y: START_Y
    };

    //-----------------------------------------
    // Sleeve — offsets computed here, AFTER back exists
    //-----------------------------------------

    const sleeveOffsetX = back.x + front.width + 100;
    const sleeveOffsetY = START_Y;

    const sleeve = generateSleevePattern(
        measurements,
        sleeveOffsetX,
        sleeveOffsetY
    );

    return {
        front,
        back,
        sleeve
    };
}