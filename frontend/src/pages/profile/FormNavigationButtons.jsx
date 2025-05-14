import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const FormNavigationButtons = ({ nextStep, handleCancel, loading }) => {
  console.log("FormNavigationButtons - nextStep:", nextStep); // Debug nextStep prop
  console.log("FormNavigationButtons - loading:", loading); // Debug loading state

  return (
    <div className="buttons-container">
      <button 
        className="button button-secondary" 
        onClick={() => {
          console.log("Cancel button clicked");
          handleCancel && handleCancel();
        }}
        disabled={loading}
      >
        <ArrowLeft size={16} className="button-icon" />
        <span className="button-text">Cancel</span>
      </button>
      
      <button 
        className="button button-primary" 
        onClick={() => {
          console.log("Next Step button clicked");
          if (nextStep) {
            nextStep();
          } else {
            console.error("nextStep function is not defined");
          }
        }}
        disabled={loading}
      >
        <span className="button-text">Next Step</span>
        <ArrowRight size={16} className="button-icon" />
      </button>
    </div>
  );
};

export default FormNavigationButtons;