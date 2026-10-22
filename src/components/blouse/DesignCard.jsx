import "./DesignCard.css";

const DesignCard = ({ design, selected, onSelect }) => {
  return (
    <button
      type="button"
      className={`design-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(design)}
    >
      <div className="design-image-wrapper">
        <img
          src={design.preview}
          alt={design.name}
          className="design-image"
        />

        {selected && (
          <div className="selected-badge">
            ✓
          </div>
        )}
      </div>

      <div className="design-card-content">
        <div>
          <h3>{design.name}</h3>
          <p>{design.type}</p>
        </div>

        <div className="selection-indicator">
          <span className={`radio ${selected ? "active" : ""}`}>
            {selected && "✓"}
          </span>

          <span>
            {selected ? "Selected" : "Select"}
          </span>
        </div>
      </div>
    </button>
  );
};

export default DesignCard;