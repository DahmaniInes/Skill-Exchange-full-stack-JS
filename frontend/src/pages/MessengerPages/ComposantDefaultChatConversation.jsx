import React from 'react';

export default function EmptyStateChatArea() {
  return (
    <div className="chat-area empty-state flex flex-col items-center justify-center h-full">
      <div className="text-center p-8 animate-fade-in">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="300"
          height="300"
          fill="#06BBCC"
          viewBox="0 0 16 16"
          className="mx-auto mb-6 animate-pulse"
        >
          <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
        </svg>

        <h3 className="text-lg font-medium text-gray-800 mb-3">Select a conversation</h3>
        <p className="text-gray-500 mb-4">Choose a contact from the list to start chatting</p>

        <div className="flex justify-center space-x-3 mt-6">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: '#06BBCC',
              animation: 'bounce 1.5s infinite ease-in-out',
              animationDelay: '0ms',
            }}
          ></div>
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: '#06BBCC',
              animation: 'bounce 1.5s infinite ease-in-out',
              animationDelay: '300ms',
            }}
          ></div>
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: '#06BBCC',
              animation: 'bounce 1.5s infinite ease-in-out',
              animationDelay: '600ms',
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        .animate-pulse {
          animation: pulse 2s infinite ease-in-out;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}