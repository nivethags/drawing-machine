import { useLocation } from "react-router-dom";
import { useState } from "react";
import MeasurementForm from "../../garments/blouse/basic/measurements/MeasurementForm";

const MeasurementPage = () => {
    const location = useLocation();

    const {
        backNeck,
        frontNeck,
        sleeve,
    } = location.state || {};

    const [measurements, setMeasurements] = useState({
        // Basic

        sleeveHeight: "",
        sleeveRound: "",
        customerName: "Kumuthavalli",

        backLength: 14,
        chest: 38,
        armhole: 15,
        hip: 27,

        pakkaKazhuthu: 6.5,
        backNeckDesignLength: 9,
        shoulder: 2,

        fNeck: "",
        fLength: "",

    });

    return (
        <div>
            <h1>Blouse Measurements</h1>

            <div style={{ padding: "20px" }}>
                <p>
                    Back Neck: <strong>{backNeck?.name}</strong>
                </p>

                <p>
                    Front Neck: <strong>{frontNeck?.name}</strong>
                </p>

                <p>
                    Sleeve: <strong>{sleeve?.name}</strong>
                </p>
            </div>

            <svg
                width="5.882in"
                height="0.6in"
                viewBox="0 0 600.67 60"
                style={{
                    margin: "20px",
                    border: "1px solid #ddd",
                    display: "block",
                }}
            >
                <g id="five-inch-calibration">

                    {/* 5 INCH CALIBRATION LINE */}

                    {/* Main line */}
                    <line
                        x1="0"
                        y1="40"
                        x2="600.67"
                        y2="40"
                        stroke="black"
                        strokeWidth="2"
                    />

                    {/* Start mark */}
                    <line
                        x1="0"
                        y1="32"
                        x2="0"
                        y2="48"
                        stroke="black"
                        strokeWidth="2"
                    />

                    {/* End mark */}
                    <line
                        x1="600.67"
                        y1="32"
                        x2="600.67"
                        y2="48"
                        stroke="black"
                        strokeWidth="2"
                    />

                    {/* Label */}
                    <text
                        x="300.335"
                        y="20"
                        fontSize="12"
                        textAnchor="middle"
                        fill="black"
                    >
                        5 inches
                    </text>

                </g>
            </svg>
            <MeasurementForm
                measurements={measurements}
                setMeasurements={setMeasurements}
                backNeck={backNeck}
                frontNeck={frontNeck}
                sleeve={sleeve}
            />
        </div>
    );
};

export default MeasurementPage;