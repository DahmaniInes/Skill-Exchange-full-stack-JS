import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './MessengerApplicationStyles.css';

const ConversationsComponent = ({ onConversationSelect }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId);
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT:', error);
      }
    }

    const fetchConversations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/MessengerRoute/conversations', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
          },
        });

        if (response.data && Array.isArray(response.data.data)) {
          const sortedConversations = response.data.data.sort((a, b) => {
            const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
            const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
            return dateB - dateA;
          });
          setConversations(sortedConversations);
        } else {
          setConversations([]);
          console.error('La réponse ne contient pas un tableau de conversations:', response.data);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setConversations([]);
      }
    };

    fetchConversations();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateMessage = (message, maxLength = 20) => {
    if (!message || message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleConversationSelect = async (conversation) => {
    setSelectedConversationId(conversation._id);

    const token = localStorage.getItem('jwtToken');
    if (!currentUserId) {
      console.error('currentUserId non défini');
      return;
    }

    const payload = {
      conversationId: conversation._id,
      userId: currentUserId,
    };

    try {
      const response = await axios.post(
        'http://localhost:5000/MessengerRoute/select-conversation',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Réponse du serveur:', response.data);

      const otherParticipant = conversation.isSelfConversation
        ? conversation.participants.find((p) => p._id === currentUserId)
        : conversation.participants.find((p) => p._id !== currentUserId);

      const hasOnlineUser = conversation.participants.some(
        (p) => p._id !== currentUserId && p.isOnline
      );
      console.log('Conversation sélectionnée:', { conversationId: conversation._id, hasOnlineUser, participants: conversation.participants });

      if (onConversationSelect) {
        onConversationSelect({
          conversation,
          conversationId: conversation._id,
          otherParticipant,
          messages: response.data.messages,
          hasOnlineUser,
        });
      }
    } catch (error) {
      console.error('Erreur lors de l’envoi des données au serveur:', error.message);
    }
  };

  const getDisplayInfo = (conversation) => {
    if (!conversation || !currentUserId) {
      return {
        name: 'Conversation inconnue',
        image: 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png',
        lastMessage: '',
        time: '',
        fullDate: '',
        hasOnlineUser: false,
      };
    }

    const hasOnlineUser = conversation.participants.some(
      (p) => p._id !== currentUserId && p.isOnline
    );
    const defaultMessage = conversation.messages?.length === 0
      ? 'Aucun message'
      : 'Nouveau message';

    if (conversation.isGroup) {
      return {
        name: conversation.name || 'Groupe sans nom',
        image: conversation.image || 'https://example.com/group-default.png',
        lastMessage: conversation.lastMessage?.content || defaultMessage,
        time: formatDate(conversation.lastMessage?.createdAt),
        fullDate: formatFullDate(conversation.lastMessage?.createdAt),
        hasOnlineUser,
      };
    }

    if (conversation.isSelfConversation) {
      const selfParticipant = conversation.participants.find((p) => p._id === currentUserId);
      return {
        name: selfParticipant
          ? `${selfParticipant.firstName} ${selfParticipant.lastName} (Moi)`
          : 'Moi-même',
        image: selfParticipant?.profilePicture || conversation.image || 'https://example.com/self-conversation.png',
        lastMessage: conversation.lastMessage?.content || 'Écrivez-vous un message',
        time: formatDate(conversation.lastMessage?.createdAt),
        hasOnlineUser: false,
      };
    }

    const otherParticipant = conversation.participants.find((p) => p._id !== currentUserId);
    return {
      name: otherParticipant
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : 'Utilisateur inconnu',
      image: otherParticipant?.profilePicture || conversation.image || 'https://example.com/user-default.png',
      lastMessage: conversation.lastMessage?.content || defaultMessage,
      time: formatDate(conversation.lastMessage?.createdAt),
      hasOnlineUser,
    };
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="conversations">
      <div className="header">
        <h2>Chats</h2>
        <div className="header-icons">
          <div className="header-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="16" y1="16" x2="22" y2="22"></line>
            </svg>
          </div>
          <div className="header-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input type="text" placeholder="Search" />
        <span className="search-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
      </div>

      <ul className="chat-list">
        {conversations.map((conversation) => {
          const { name, image, lastMessage, time, fullDate, hasOnlineUser } = getDisplayInfo(conversation);

          return (
            <li
              key={conversation._id}
              className={`chat-item ${selectedConversationId === conversation._id ? 'selected' : ''}`}
              onClick={() => handleConversationSelect(conversation)}
            >
              <div className="chat-avatar">
                <img
                  src={image}
                  alt={name}
                  onError={(e) => {
                    e.target.src = conversation.isGroup
                      ? 'https://static.vecteezy.com/ti/vecteur-libre/p1/5194103-icone-de-personnes-conception-plate-de-symbole-de-personnes-sur-un-fond-blanc-gratuit-vectoriel.jpg'
                      : 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png';
                  }}
                />
              </div>
              <div className="chat-details">
                <div className="chat-header">
                  <span className="chat-name">{name}</span>
                  <span className="chat-time">{time}</span>
                </div>
                <div className="chat-message">
                  <span className="chat-message-text">{truncateMessage(lastMessage)}</span>
                  {fullDate && (
                    <span className="chat-message-date"> · {fullDate}</span>
                  )}
                </div>
                <div className={`unread-indicator ${hasOnlineUser ? 'online' : ''}`}></div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ConversationsComponent;