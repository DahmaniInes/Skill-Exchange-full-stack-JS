// components/common/FormNavigation.js
import { ChevronLeft, ChevronRight } from "lucide-react";

const FormNavigation = ({ step, totalSteps, nextStep, prevStep }) => {
  return (
    <div className="progress-nav">
      <button 
        className="progress-nav-btn" 
        onClick={prevStep}
        disabled={step === 1}
      >
        <ChevronLeft size={20} />
      </button>
      <button 
        className="progress-nav-btn" 
        onClick={nextStep}
        disabled={step === totalSteps}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default FormNavigation;
