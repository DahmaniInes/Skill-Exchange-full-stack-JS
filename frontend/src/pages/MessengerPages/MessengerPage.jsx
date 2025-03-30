import React, { useState } from 'react';
import './MessengerStyles.css';
import ConversationsList from './ConversationsComponent';
import ChatConversation from './ChatConversationComponet';

const MessengerPage = () => {
    const [selectedUser, setSelectedUser] = useState(null);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
    };

    return (
        <div className="messenger-app">
            <div className="messenger-container">
                <div className="conversations-panel">
                    <ConversationsList onUserSelect={handleUserSelect} />
                </div>
                <div className="chat-panel">
                    <ChatConversation selectedUser={selectedUser} />
                </div>
            </div>
        </div>
    );
};

export default MessengerPage;