import React from 'react';

const RoadmapTimeline = ({ steps, activeStep, onStepComplete }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div 
          key={index}
          className={`border-l-4 pl-4 pb-6 ${
            step.completed ? 'border-green-500' : 
            index === activeStep ? 'border-blue-500' : 'border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <div 
              className={`rounded-full w-8 h-8 flex items-center justify-center mr-2 ${
                step.completed ? 'bg-green-500 text-white' : 
                index === activeStep ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {step.completed ? '✓' : index + 1}
            </div>
            <h3 className={`font-medium ${
              step.completed ? 'text-green-700' : 
              index === activeStep ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {step.title}
            </h3>
          </div>
          
          <div className="mt-2 ml-10 text-sm text-gray-600">
            <p>{step.description.substring(0, 100)}{step.description.length > 100 ? '...' : ''}</p>
            
            {index === activeStep && !step.completed && (
              <button 
                onClick={() => onStepComplete(index)}
                className="mt-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
              >
                Marquer comme terminé
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoadmapTimeline;