import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import backNeckDesigns from "../../data/blouse/backNeckDesigns";
import frontNeckDesigns from "../../data/blouse/frontNeckDesigns";

const FrontNeckSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const backNeck = location.state?.backNeck;

  const [selectedFrontNeck, setSelectedFrontNeck] = useState(null);

  const handleNext = () => {
    if (!selectedFrontNeck) {
      alert("Please select a front neck design.");
      return;
    }

    navigate("/sleeve-selection", {
      state: {
        backNeck,
        frontNeck: selectedFrontNeck,
      },
    });
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Select Front Neck Design</h1>

      {backNeck && (
        <p>
          Selected Back Neck:{" "}
          <strong>{backNeck.name}</strong>
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {frontNeckDesigns.map((design) => {
          const isSelected =
            selectedFrontNeck?.id === design.id;

          return (
            <div
              key={design.id}
              onClick={() =>
                setSelectedFrontNeck(design)
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
          disabled={!selectedFrontNeck}
        >
          Next → Select Sleeve
        </button>
      </div>
    </div>
  );
};

export default FrontNeckSelection;