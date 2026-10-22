import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import backNeckDesigns from "../../data/blouse/backNeckDesigns";
import DesignCard from "../../components/blouse/DesignCard";
import StepIndicator from "../../components/blouse/StepIndicator";

import "./BackNeckSelection.css";

const BackNeckSelection = () => {
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredDesigns = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return backNeckDesigns;
    }

    return backNeckDesigns.filter(
      (design) =>
        design.name.toLowerCase().includes(search) ||
        design.type.toLowerCase().includes(search)
    );
  }, [searchTerm]);

  const handleSelect = (design) => {
    setSelectedDesign(design);
  };

const handleContinue = () => {
  if (!selectedDesign) {
    return;
  }

  console.log("Selected Back Neck:", selectedDesign);

  navigate("/blouse/front-neck", {
    state: {
      backNeck: selectedDesign,
    },
  });
};

  return (
    <div className="blouse-page">

      {/* Header */}
      <header className="blouse-header">
        <div className="header-left">
          <button className="back-button">
            ←
          </button>

          <div>
            <p className="page-category">
              Blouse
            </p>

            <h1>
              Design Selection
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="blouse-content">

        <section className="page-intro">
          <div>
            <p className="step-label">
              STEP 1 OF 5
            </p>

            <h2>
              Select Back Neck Design
            </h2>

            <p>
              Choose the back neck design for this blouse.
            </p>
          </div>
        </section>

        {/* Steps */}
        <StepIndicator currentStep={1} />

        {/* Search */}
        <section className="design-toolbar">

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search back neck designs..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="design-count">
            {filteredDesigns.length} Designs
          </div>

        </section>

        {/* Design Grid */}
        <section className="design-grid">

          {filteredDesigns.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              selected={selectedDesign?.id === design.id}
              onSelect={handleSelect}
            />
          ))}

          {filteredDesigns.length === 0 && (
            <div className="empty-state">
              <h3>
                No designs found
              </h3>

              <p>
                Try searching for another design.
              </p>
            </div>
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="selection-footer">

        <div className="selection-info">
          {selectedDesign ? (
            <>
              <span>Selected:</span>
              <strong>
                {selectedDesign.name}
              </strong>
            </>
          ) : (
            <span>
              Select a back neck design to continue
            </span>
          )}
        </div>

        <button
          className="continue-button"
          disabled={!selectedDesign}
          onClick={handleContinue}
        >
          Continue
          <span>→</span>
        </button>

      </footer>

    </div>
  );
};

export default BackNeckSelection;