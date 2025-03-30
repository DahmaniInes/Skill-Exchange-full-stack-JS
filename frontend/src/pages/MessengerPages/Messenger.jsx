import React, { useState } from 'react';
import ConversationsList from './ConversationsList';
import ChatConversation from './ChatConversation';
import './MessengerApplicationStyles.css';

const Messenger = () => {
    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <div className="messenger-container">
            <ConversationsList onUserSelect={setSelectedUser} />
            <ChatConversation selectedUser={selectedUser} />
        </div>
    );
};

export default Messenger;