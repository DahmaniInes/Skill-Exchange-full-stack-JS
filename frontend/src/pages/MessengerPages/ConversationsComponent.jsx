import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MessengerApplicationStyles.css';

const ConversationsComponent = ({ onUserSelect }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/MessengerRoute/users');
                setUsers(response.data.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleUserSelect = (user) => {
        setSelectedUserId(user._id);
        onUserSelect(user);
    };

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur: {error}</div>;

    return (
        <div className="conversations">
            <div className="header">
                <h2>Chats</h2>
                <div className="header-icons">
                    <div className="header-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                            <circle cx="12" cy="12" r="4"></circle>
                            <line x1="16" y1="16" x2="22" y2="22"></line>
                        </svg>
                    </div>
                    <div className="header-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div className="search-bar">
                <input type="text" placeholder="Search" />
                <span className="search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
            </div>
            
            <ul className="chat-list">
                {users.map((user) => (
                    <li 
                        key={user._id} 
                        className={`chat-item ${selectedUserId === user._id ? 'selected' : ''}`}
                        onClick={() => handleUserSelect(user)}
                    >
                        <div className="chat-avatar">
                            <img 
                                src="https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png"
                                alt={`${user.firstName} ${user.lastName}`}
                            />
                        </div>
                        <div className="chat-details">
                            <div className="chat-header">
                                <span className="chat-name">{user.firstName} {user.lastName}</span>
                                <span className="chat-time">1m</span>
                            </div>
                            <div className="chat-message">
                                Nouveau message
                            </div>
                        </div>
                        <div className="unread-indicator"></div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ConversationsComponent;