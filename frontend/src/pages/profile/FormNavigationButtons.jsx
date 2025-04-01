import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

    const FormNavigationButtons = ({ nextStep, handleCancel }) => {
        return (
          <div className="buttons-container">
            <button 
              className="button button-secondary" 
              onClick={handleCancel}
            >
              <ArrowLeft size={16} className="button-icon" />
              <span className="button-text">Cancel</span>
            </button>
            
            <button 
              className="button button-primary" 
              onClick={() => {
                console.log("Next Step Clicked"); // Ajout d'un log pour tester
                nextStep && nextStep(); // Vérifie si nextStep est défini avant d'appeler
              }}
            >
              <span className="button-text">Next Step</span>
              <ArrowRight size={16} className="button-icon" />
            </button>
          </div>
        );
      };
      

export default FormNavigationButtons;