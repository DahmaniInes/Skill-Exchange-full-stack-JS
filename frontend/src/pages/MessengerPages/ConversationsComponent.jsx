import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './MessengerApplicationStyles.css';
import io from 'socket.io-client';

const ConversationsComponent = ({ onConversationSelect }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    console.log("=== INITIALISATION DU COMPOSANT ===");
    console.log("État actuel des messages non lus:", unseenMessages);
    
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId);
        console.log('Initialisation : currentUserId défini', decoded.userId);
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT:', error);
      }
    }

    socketRef.current = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket : Connexion réussie au serveur avec userId', currentUserId);
      socketRef.current.emit('authenticate', currentUserId);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket : Erreur de connexion', error.message);
    });

    socketRef.current.on('newMessage', (message) => {
      console.log('===== NOUVEAU MESSAGE REÇU =====');
      console.log('Message reçu:', message);
      
      if (!message || !message.conversation?._id || !message._id) {
        console.error('Message invalide ou incomplet:', message);
        return;
      }

      setConversations((prevConversations) => {
        const conversationExists = prevConversations.some(conv => conv?._id === message.conversation._id);
        if (!conversationExists) {
          console.log('Conversation non trouvée dans la liste actuelle, ignorée:', message.conversation._id);
          return prevConversations;
        }

        const updatedConversations = prevConversations.map((conv) => {
          if (!conv || conv._id !== message.conversation._id) return conv;
          console.log('Mise à jour de la conversation:', conv._id);
          return {
            ...conv,
            lastMessage: {
              _id: message._id,
              content: message.content || 'Message vide',
              createdAt: message.createdAt || new Date(),
              sender: message.sender || { _id: 'unknown' },
              read: message.read ?? false,
            },
            messages: [...(conv.messages || []), message],
          };
        }).filter(conv => conv && conv._id); // Filtrer les objets invalides après mise à jour
        
        return updatedConversations.sort((a, b) => {
          const dateA = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
          const dateB = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
          return dateB - dateA;
        });
      });

      if (
        message.sender?._id !== currentUserId &&
        message.conversation?._id !== selectedConversationId &&
        !message.read
      ) {
        console.log('MESSAGE MARQUÉ COMME NON LU:', message.conversation._id);
        setUnseenMessages((prev) => ({
          ...prev,
          [message.conversation._id]: true,
        }));
      } else {
        console.log('Message déjà vu ou envoyé par moi-même');
      }
    });

    socketRef.current.on('groupUpdated', (data) => {
      console.log('Socket : Mise à jour du groupe reçue', data);
      if (!data?.conversationId) {
        console.error('Données de mise à jour de groupe invalides:', data);
        return;
      }
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv?._id === data.conversationId
            ? { ...conv, name: data.groupName, image: data.groupPhoto }
            : conv
        ).filter(conv => conv && conv._id)
      );
    });

    const fetchConversations = async () => {
      console.log("=== CHARGEMENT DES CONVERSATIONS ===");
      try {
        const response = await axios.get('http://localhost:5000/MessengerRoute/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && Array.isArray(response.data.data)) {
          console.log("Données brutes reçues du serveur:", response.data.data);
          
          const validConversations = response.data.data.filter(conv => 
            conv && 
            conv._id && 
            (conv.lastMessage === null || (conv.lastMessage && typeof conv.lastMessage === 'object'))
          ).map(conv => ({
            ...conv,
            lastMessage: conv.lastMessage || { content: 'Aucun message', createdAt: null }
          }));
          
          console.log("Conversations valides après filtrage:", validConversations);
          
          const sortedConversations = validConversations.sort((a, b) => {
            const dateA = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
            const dateB = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
            return dateB - dateA;
          });
          
          const newUnseenMessages = {};
          sortedConversations.forEach(conv => {
            if (
              conv?.lastMessage &&
              conv.lastMessage.sender?._id !== currentUserId &&
              !conv.lastMessage.read
            ) {
              newUnseenMessages[conv._id] = true;
              console.log(`Conversation ${conv._id}: dernier message non lu détecté`);
            }
          });
          
          setConversations(sortedConversations);
          setUnseenMessages(newUnseenMessages);
          setLoading(false);
        } else {
          setConversations([]);
          console.error('La réponse ne contient pas un tableau de conversations:', response.data);
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setConversations([]);
        console.error('Erreur lors du chargement des conversations', err.message);
      }
    };

    fetchConversations();
    const intervalId = setInterval(fetchConversations, 30000);

    return () => {
      clearInterval(intervalId);
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket : Déconnexion effectuée');
      }
    };
  }, [currentUserId, selectedConversationId]);

  useEffect(() => {
    console.log("===== MISE À JOUR DE L'ÉTAT UNSEEN MESSAGES =====");
    console.log("Nouvel état:", unseenMessages);
  }, [unseenMessages]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
    if (!message || message.length <= maxLength) return message || '';
    return message.substring(0, maxLength) + '...';
  };

  const handleConversationSelect = async (conversation) => {
    if (!conversation || !conversation._id) {
      console.error('Conversation invalide sélectionnée:', conversation);
      return;
    }

    console.log("===== SÉLECTION DE CONVERSATION =====");
    console.log("ID de la conversation sélectionnée:", conversation._id);
    
    setSelectedConversationId(conversation._id);
    setUnseenMessages((prev) => ({
      ...prev,
      [conversation._id]: false,
    }));

    const token = localStorage.getItem('jwtToken');
    if (!currentUserId) {
      console.error('currentUserId non défini');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/MessengerRoute/select-conversation',
        {
          conversationId: conversation._id,
          userId: currentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Réponse du serveur pour la sélection:', response.data);

      const updatedMessages = response.data.messages || [];
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv?._id === conversation._id
            ? { ...conv, messages: updatedMessages, lastMessage: response.data.conversation?.lastMessage || conv.lastMessage }
            : conv
        ).filter(conv => conv && conv._id)
      );

      const hasOnlineUser = conversation.participants?.some(
        (p) => p?._id !== currentUserId && p.isOnline
      ) || false;

      const updatedConversation = conversations.find((conv) => conv?._id === conversation._id) || conversation;
      const mergedMessages = [
        ...(updatedConversation?.messages || []),
        ...(response.data.messages || []),
      ].filter(
        (msg, index, self) =>
          index === self.findIndex((m) => m._id === msg._id)
      );

      if (conversation.isGroup) {
        const groupInfo = {
          name: conversation.name || generateGroupName(conversation.participants),
          image: conversation.image || 'https://static.vecteezy.com/ti/vecteur-libre/p1/5194103-icone-de-personnes-conception-plate-de-symbole-de-personnes-sur-un-fond-blanc-gratuit-vectoriel.jpg',
        };

        console.log('Données passées à ChatConversation (groupe):', {
          conversation,
          conversationId: conversation._id,
          groupInfo,
          messages: mergedMessages,
          hasOnlineUser,
        });

        if (onConversationSelect) {
          onConversationSelect({
            conversation,
            conversationId: conversation._id,
            groupInfo,
            messages: mergedMessages,
            hasOnlineUser,
          });
        }
      } else {
        const otherParticipant = conversation.isSelfConversation
          ? conversation.participants?.find((p) => p?._id === currentUserId)
          : conversation.participants?.find((p) => p?._id !== currentUserId);

        console.log('Données passées à ChatConversation (individuel):', {
          conversation,
          conversationId: conversation._id,
          otherParticipant,
          messages: mergedMessages,
          hasOnlineUser,
        });

        if (onConversationSelect) {
          onConversationSelect({
            conversation,
            conversationId: conversation._id,
            otherParticipant,
            messages: mergedMessages,
            hasOnlineUser,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l’envoi des données au serveur:', error.message);
    }
  };

  const generateGroupName = (participants) => {
    if (!participants || participants.length === 0) return 'Groupe sans nom';
    const participantNames = participants
      .filter((p) => p?._id !== currentUserId)
      .map((p) => p?.firstName || 'Inconnu');
    if (participantNames.length === 0) return 'Groupe vide';
    if (participantNames.length <= 2) return participantNames.join(', ');
    return `${participantNames.slice(0, 2).join(', ')}...`;
  };

  const getDisplayInfo = (conversation) => {
    if (!conversation || !conversation._id || !currentUserId) {
      console.warn('Conversation invalide ou incomplète passée à getDisplayInfo:', conversation);
      return {
        name: 'Conversation inconnue',
        image: 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png',
        lastMessage: 'Aucun message',
        time: '',
        fullDate: '',
        hasOnlineUser: false,
      };
    }

    const hasOnlineUser = conversation.participants?.some(
      (p) => p?._id !== currentUserId && p.isOnline
    ) || false;
    const defaultMessage = conversation.messages?.length === 0
      ? 'Aucun message'
      : 'Nouveau message';

    if (!conversation.lastMessage) {
      console.warn(`Conversation ${conversation._id} sans lastMessage, utilisation de la valeur par défaut`);
    }

    if (conversation.isGroup) {
      const groupName = conversation.name || generateGroupName(conversation.participants);
      return {
        name: groupName,
        image: conversation.image || 'https://static.vecteezy.com/ti/vecteur-libre/p1/5194103-icone-de-personnes-conception-plate-de-symbole-de-personnes-sur-un-fond-blanc-gratuit-vectoriel.jpg',
        lastMessage: conversation.lastMessage?.content || defaultMessage,
        time: formatDate(conversation.lastMessage?.createdAt),
        fullDate: formatFullDate(conversation.lastMessage?.createdAt),
        hasOnlineUser,
      };
    }

    if (conversation.isSelfConversation) {
      const selfParticipant = conversation.participants?.find((p) => p?._id === currentUserId);
      return {
        name: selfParticipant
          ? `${selfParticipant.firstName} ${selfParticipant.lastName} (Moi)`
          : 'Moi-même',
        image: selfParticipant?.profilePicture || conversation.image || 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png',
        lastMessage: conversation.lastMessage?.content || 'Écrivez-vous un message',
        time: formatDate(conversation.lastMessage?.createdAt),
        fullDate: formatFullDate(conversation.lastMessage?.createdAt),
        hasOnlineUser: false,
      };
    }

    const otherParticipant = conversation.participants?.find((p) => p?._id !== currentUserId);
    return {
      name: otherParticipant
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : 'Utilisateur inconnu',
      image: otherParticipant?.profilePicture || conversation.image || 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png',
      lastMessage: conversation.lastMessage?.content || defaultMessage,
      time: formatDate(conversation.lastMessage?.createdAt),
      fullDate: formatFullDate(conversation.lastMessage?.createdAt),
      hasOnlineUser,
    };
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  console.log('===== RENDU DES CONVERSATIONS =====');
  console.log('Total des conversations:', conversations.length);
  console.log('Conversations actuelles:', conversations);
  console.log('État des messages non lus au rendu:', unseenMessages);
  console.log('Conversation sélectionnée:', selectedConversationId);

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
        {conversations.filter(conv => conv && conv._id).map((conversation) => {
          const { name, image, lastMessage, time, fullDate, hasOnlineUser } = getDisplayInfo(conversation);
          const isUnseen = unseenMessages[conversation._id] === true;
          
          console.log(`Conversation ${conversation._id}:`, {
            name,
            isUnseen,
            lastMessage: truncateMessage(lastMessage)
          });

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
                  <span className="chat-name" style={{ fontWeight: isUnseen ? 'bold' : 'normal' }}>{name}</span>
                  <span className="chat-time" style={{ fontWeight: isUnseen ? 'bold' : 'normal' }}>{time}</span>
                </div>
                <div className="chat-message">
                  <span
                    className="chat-message-text"
                    style={{ fontWeight: isUnseen ? 'bold' : 'normal' }}
                  >
                    {truncateMessage(lastMessage)}
                  </span>
                  {fullDate && (
                    <span className="chat-message-date" style={{ fontWeight: isUnseen ? 'bold' : 'normal' }}> · {fullDate}</span>
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