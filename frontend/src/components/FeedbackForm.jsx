import React, { useState } from 'react';

const FeedbackForm = ({ onSubmit }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(feedback);
    setFeedback('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label 
          htmlFor="feedback" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Partagez vos progrès ou difficultés pour personnaliser votre parcours:
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows="4"
          placeholder="Je progresse bien dans... J'ai des difficultés avec..."
          required
        ></textarea>
      </div>
      <button 
        type="submit" 
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Envoyer mon feedback
      </button>
    </form>
  );
};

export default FeedbackForm;