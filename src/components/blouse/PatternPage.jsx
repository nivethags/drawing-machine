import { useLocation } from "react-router-dom";
import PatternCanvas from "../../garments/blouse/basic/patterns/PatternCanvas";

const PatternPage = () => {
  const location = useLocation();

  const {
    measurements,
    backNeck,
    frontNeck,
    sleeve,
  } = location.state || {};

  return (
    <div>
      <h1>Blouse Pattern</h1>

      <div>
        <p>
          Front Neck: <strong>{frontNeck?.name}</strong>
        </p>

        <p>
          Back Neck: <strong>{backNeck?.name}</strong>
        </p>

        <p>
          Sleeve: <strong>{sleeve?.name}</strong>
        </p>
      </div>

      <PatternCanvas
        measurements={measurements}
        backNeck={backNeck}
        frontNeck={frontNeck}
        sleeve={sleeve}
      />
    </div>
  );
};

export default PatternPage;