import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import sleeveDesigns from "../../data/blouse/sleevedesigns";

const SleeveSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { backNeck, frontNeck } = location.state || {};

  const [selectedSleeve, setSelectedSleeve] = useState(null);

  const handleNext = () => {
    if (!selectedSleeve) {
      alert("Please select a sleeve design.");
      return;
    }

    navigate("/measurements", {
      state: {
        backNeck,
        frontNeck,
        sleeve: selectedSleeve,
      },
    });
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Select Sleeve Design</h1>

      <div style={{ marginBottom: "20px" }}>
        <p>
          Selected Back Neck:{" "}
          <strong>{backNeck?.name}</strong>
        </p>

        <p>
          Selected Front Neck:{" "}
          <strong>{frontNeck?.name}</strong>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {sleeveDesigns.map((design) => {
          const isSelected =
            selectedSleeve?.id === design.id;

          return (
            <div
              key={design.id}
              onClick={() =>
                setSelectedSleeve(design)
              }
              style={{
                border: isSelected
                  ? "3px solid blue"
                  : "1px solid #ddd",
                borderRadius: "10px",
                padding: "15px",
                cursor: "pointer",
                background: isSelected
                  ? "#f0f6ff"
                  : "#fff",
              }}
            >
              <img
                src={design.preview}
                alt={design.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />

              <h3>{design.name}</h3>

              <p>{design.type}</p>

              <small>
                ID: {design.id}
              </small>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "30px" }}>
        <button
          onClick={handleNext}
          disabled={!selectedSleeve}
        >
          Next → Measurements
        </button>
      </div>
    </div>
  );
};

export default SleeveSelection;