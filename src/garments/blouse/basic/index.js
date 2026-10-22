import React, { useState } from "react";

import MeasurementForm from "./measurements/MeasurementForm";
import PatternCanvas from "./patterns/PatternCanvas";

const PatternDesigner = () => {
  const [measurements, setMeasurements] = useState({
    customerName: "",

    // Sleeve
    sleeveHeight: 6,
    lengthEase: 1,
    sleeveRound: 12,
    armhole: 15,
    straightRun: 1.5,
    underarmEase: 2,

    // Front Neck
    fNeck: 7,
    fLength: 14,

    // These are required by Front Neck calculation
    hip: 36,
    chest: 36,
    shoulder: 15,
    pakkaKazhuthu: 6,
  });

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
      }}
    >
      <MeasurementForm
        measurements={measurements}
        setMeasurements={setMeasurements}
      />

      <PatternCanvas
        measurements={measurements}
      />
    </div>
  );
};

export default PatternDesigner;