import "./StepIndicator.css";

const steps = [
  {
    number: 1,
    label: "Back Neck",
  },
  {
    number: 2,
    label: "Front Neck",
  },
  {
    number: 3,
    label: "Sleeve",
  },
  {
    number: 4,
    label: "Measurements",
  },
  {
    number: 5,
    label: "Drawing",
  },
];

const StepIndicator = ({ currentStep = 1 }) => {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div className="step-wrapper" key={step.number}>
          <div
            className={`step ${
              step.number === currentStep
                ? "active"
                : step.number < currentStep
                ? "completed"
                : ""
            }`}
          >
            <div className="step-number">
              {step.number < currentStep ? "✓" : step.number}
            </div>

            <span>{step.label}</span>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`step-line ${
                step.number < currentStep ? "completed" : ""
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;