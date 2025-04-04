import React, { useState } from 'react';
import './MessengerStyles.css';
import ConversationsList from './ConversationsComponent';
import ChatConversation from './ChatConversationComponet';
import SecondComponent from './SecondComponent';

const MessengerPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showSecondComponent, setShowSecondComponent] = useState(false);

  const handleConversationSelect = (conversationData) => {
    console.log('MessengerPage : Conversation sélectionnée avec données', conversationData);
    setSelectedConversation(conversationData);
    setShowSecondComponent(false);
  };

  const handleToggleComponent = () => {
    setShowSecondComponent(!showSecondComponent);
  };

  return (
    <div className="messenger-app">
      <div className="messenger-container">
        <div className="conversations-panel">
          <ConversationsList onConversationSelect={handleConversationSelect} />
        </div>
        <div className="chat-panel">
          {showSecondComponent ? (
            <SecondComponent
              conversation={selectedConversation?.conversation}
              otherParticipant={selectedConversation?.otherParticipant}
            />
          ) : (
            <ChatConversation
              conversation={selectedConversation?.conversation}
              messages={selectedConversation?.messages} // Ajout des messages ici
              onToggleComponent={handleToggleComponent}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessengerPage;