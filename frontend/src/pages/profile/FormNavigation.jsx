import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const FormNavigation = ({ step, totalSteps, nextStep, prevStep }) => {
  const [progressWidth, setProgressWidth] = useState(0);
  
  useEffect(() => {
    // Calculer le pourcentage de progression
    const width = ((step - 1) / (totalSteps - 1)) * 100;
    setProgressWidth(width);
  }, [step, totalSteps]);

  return (
    <div className="w-full">
      {/* Barre de progression */}
      <div className="w-full mb-6">
        <div className="relative pt-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold inline-block text-blue-600">
                Progression
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {Math.round(progressWidth)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${progressWidth}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300 ease-in-out"
            ></div>
          </div>
        </div>
      </div>

      {/* Boutons de navigation */}
      <div className="flex justify-between">
        <button
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={prevStep}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Précédent
        </button>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={nextStep}
          disabled={step === totalSteps}
        >
          Suivant
          <ChevronRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default FormNavigation;