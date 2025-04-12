import React from 'react';

const ProgressTracker = ({ progress }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-48 bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="text-sm font-medium text-gray-700">
        {progress}% Complété
      </div>
    </div>
  );
};

export default ProgressTracker;