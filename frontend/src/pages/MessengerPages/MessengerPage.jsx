import React, { useState } from 'react';
import './MessengerStyles.css';
import ConversationsList from './ConversationsComponent';
import ChatConversation from './ChatConversationComponet';
import SecondComponent from './SecondComponent';

const MessengerPage = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [showSecondComponent, setShowSecondComponent] = useState(false);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setShowSecondComponent(false); // Revenir à ChatConversation lors de la sélection d'un nouvel utilisateur
    };

    const handleToggleComponent = () => {
        setShowSecondComponent(!showSecondComponent);
    };

    return (
        <div className="messenger-app">
            <div className="messenger-container">
                <div className="conversations-panel">
                    <ConversationsList onUserSelect={handleUserSelect} />
                </div>
                <div className="chat-panel">
                    {showSecondComponent ? (
                        <SecondComponent selectedUser={selectedUser} />
                    ) : (
                        <ChatConversation 
                            selectedUser={selectedUser} 
                            onToggleComponent={handleToggleComponent} // Passer la fonction
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessengerPage;