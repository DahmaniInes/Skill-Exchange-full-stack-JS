import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './MessengerApplicationStyles.css';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const ConversationsComponent = ({ onConversationSelect }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const socketRef = useRef(null);
  const notificationRef = useRef(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    //console.log("[CONVERSATIONS] === INITIALISATION DU COMPOSANT ===");
    //console.log("[CONVERSATIONS] État actuel des messages non lus:", unseenMessages);

    const token = localStorage.getItem('jwtToken');
    let decoded;
    if (token) {
      try {
        decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId);
        setUserRole(decoded.role);
        //console.log('[CONVERSATIONS] Initialisation : currentUserId défini', decoded.userId, 'Rôle:', decoded.role);
      } catch (error) {
        console.error('[CONVERSATIONS] Erreur lors du décodage du token JWT:', error);
        setError('Erreur d’authentification');
        setLoading(false);
        return;
      }
    } else {
      console.error('[CONVERSATIONS] Aucun token JWT trouvé');
      setError('Utilisateur non authentifié');
      setLoading(false);
      return;
    }

    socketRef.current = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on('connect', () => {
      console.log('[SOCKET] Connexion réussie au serveur avec userId', decoded.userId);
      socketRef.current.emit('authenticate', { userId: decoded.userId });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[SOCKET] Erreur de connexion:', error.message);
    });

    socketRef.current.on('newMessage', (message) => {
      console.log('[SOCKET] ===== NOUVEAU MESSAGE REÇU =====');
      console.log('[SOCKET] Message reçu:', message);

      if (!message || !message.conversation?._id || !message._id) {
        console.error('[SOCKET] Message invalide ou incomplet:', message);
        return;
      }

      setConversations((prevConversations) => {
        const conversationExists = prevConversations.some(conv => conv?._id === message.conversation._id);
        if (!conversationExists) {
          console.log('[SOCKET] Conversation non trouvée dans la liste actuelle, ignorée:', message.conversation._id);
          return prevConversations;
        }

        const updatedConversations = prevConversations.map((conv) => {
          if (!conv || conv._id !== message.conversation._id) return conv;
          console.log('[SOCKET] Mise à jour de la conversation:', conv._id);
          return {
            ...conv,
            lastMessage: {
              _id: message._id,
              content: message.content || 'Message vide',
              createdAt: message.createdAt || new Date(),
              sender: message.sender || { _id: 'unknown' },
              read: message.read ?? false,
              feedback: message.feedback || { message: '', emoji: '😐' },
            },
            messages: [...(conv.messages || []), message],
          };
        }).filter(conv => conv && conv._id);

        return updatedConversations.sort((a, b) => {
          const dateA = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
          const dateB = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
          return dateB - dateA;
        });
      });

      if (
        message.sender?._id !== decoded.userId &&
        message.conversation?._id !== selectedConversationId &&
        !message.read
      ) {
        console.log('[SOCKET] MESSAGE MARQUÉ COMME NON LU:', message.conversation._id);
        setUnseenMessages((prev) => ({
          ...prev,
          [message.conversation._id]: true,
        }));
      } else {
        console.log('[SOCKET] Message déjà vu ou envoyé par moi-même');
      }
    });

    socketRef.current.on('groupUpdated', (data) => {
      console.log('[SOCKET] Mise à jour du groupe reçue:', data);
      if (!data?.conversationId) {
        console.error('[SOCKET] Données de mise à jour de groupe invalides:', data);
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

    socketRef.current.on('emotionalAlert', (alertData) => {
      console.log('[SOCKET] Alerte émotionnelle reçue:', alertData);
      if (alertData && alertData.message && alertData.timestamp) {
        console.log('[SOCKET] Notification valide, ajout à l’état:', alertData);
        setNotifications((prev) => [...prev, { ...alertData, type: 'emotional_alert' }]);
      } else {
        console.error('[SOCKET] Notification émotionnelle invalide:', alertData);
      }
    });

    socketRef.current.on('recommendation', (recommendationData) => {
      console.log('[SOCKET] Recommandation émotionnelle reçue:', recommendationData);
      if (recommendationData && recommendationData.message && recommendationData.timestamp) {
        console.log('[SOCKET] Recommandation valide, ajout à l’état:', recommendationData);
        setNotifications((prev) => [...prev, { ...recommendationData, type: 'recommendation' }]);
      } else {
        console.error('[SOCKET] Recommandation invalide:', recommendationData);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('[SOCKET] Déconnexion du serveur');
    });

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const fetchConversations = async () => {
      //console.log("[CONVERSATIONS] === CHARGEMENT DES CONVERSATIONS ===");
      try {
        const response = await axios.get('http://localhost:5000/MessengerRoute/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && Array.isArray(response.data.data)) {
          //console.log("[CONVERSATIONS] Données brutes reçues du serveur:", response.data.data);

          const validConversations = response.data.data.filter(conv =>
            conv &&
            conv._id &&
            (conv.lastMessage === null || (conv.lastMessage && typeof conv.lastMessage === 'object'))
          ).map(conv => ({
            ...conv,
            lastMessage: conv.lastMessage || { content: 'Aucun message', createdAt: null, feedback: { message: '', emoji: '😐' } }
          }));

          //console.log("[CONVERSATIONS] Conversations valides après filtrage:", validConversations);

          const sortedConversations = validConversations.sort((a, b) => {
            const dateA = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
            const dateB = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
            return dateB - dateA;
          });

          const newUnseenMessages = {};
          sortedConversations.forEach(conv => {
            if (
              conv?.lastMessage &&
              conv.lastMessage.sender?._id !== decoded.userId &&
              !conv.lastMessage.read
            ) {
              newUnseenMessages[conv._id] = true;
              //console.log(`[CONVERSATIONS] Conversation ${conv._id}: dernier message non lu détecté`);
            }
          });

          setConversations(sortedConversations);
          setUnseenMessages(newUnseenMessages);
          setLoading(false);
        } else {
          setConversations([]);
          console.error('[CONVERSATIONS] La réponse ne contient pas un tableau de conversations:', response.data);
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setConversations([]);
        console.error('[CONVERSATIONS] Erreur lors du chargement des conversations:', err.message);
      }
    };

    const fetchNotifications = async () => {
      console.log("[NOTIFICATIONS] === CHARGEMENT DES NOTIFICATIONS ===");
      try {
        const response = await axios.get('http://localhost:5000/MessengerRoute/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('[NOTIFICATIONS] Succès: Notifications récupérées:', response.data.data);
        console.log('[NOTIFICATIONS] Détails:', response.data.data.map(n => ({
          _id: n._id,
          message: n.message,
          type: n.type,
          timestamp: n.timestamp,
          read: n.read
        })));
        setNotifications(response.data.data || []);
      } catch (error) {
        console.error('[NOTIFICATIONS] Erreur lors de la récupération des notifications:', error.message);
        console.error('[NOTIFICATIONS] Détails de l’erreur:', error.response?.data || error);
      }
    };

    if (decoded.userId) {
      fetchConversations();
      fetchNotifications();
      const intervalId = setInterval(fetchConversations, 30000);
      return () => {
        clearInterval(intervalId);
        if (socketRef.current) {
          socketRef.current.off('connect');
          socketRef.current.off('connect_error');
          socketRef.current.off('newMessage');
          socketRef.current.off('groupUpdated');
          socketRef.current.off('emotionalAlert');
          socketRef.current.off('recommendation');
          socketRef.current.off('disconnect');
          socketRef.current.disconnect();
          console.log('[SOCKET] Déconnexion effectuée');
        }
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedConversationId]);

  useEffect(() => {
    console.log("[CONVERSATIONS] ===== MISE À JOUR DE L'ÉTAT UNSEEN MESSAGES =====");
    console.log("[CONVERSATIONS] Nouvel état:", unseenMessages);
  }, [unseenMessages]);

  useEffect(() => {
    console.log("[NOTIFICATIONS] ===== MISE À JOUR DE L'ÉTAT NOTIFICATIONS =====");
    console.log("[NOTIFICATIONS] Nouvel état:", notifications);
  }, [notifications]);

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
      console.error('[CONVERSATIONS] Conversation invalide sélectionnée:', conversation);
      return;
    }

    console.log("[CONVERSATIONS] ===== SÉLECTION DE CONVERSATION =====");
    console.log("[CONVERSATIONS] ID de la conversation sélectionnée:", conversation._id);

    setSelectedConversationId(conversation._id);
    setUnseenMessages((prev) => ({
      ...prev,
      [conversation._id]: false,
    }));

    const token = localStorage.getItem('jwtToken');
    if (!currentUserId) {
      console.error('[CONVERSATIONS] currentUserId non défini');
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

      //console.log('[CONVERSATIONS] Réponse du serveur pour la sélection:', response.data);

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

        /*console.log('[CONVERSATIONS] Données passées à ChatConversation (groupe):', {
          conversation,
          conversationId: conversation._id,
          groupInfo,
          messages: mergedMessages,
          hasOnlineUser,
        });*/

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

        /*console.log('[CONVERSATIONS] Données passées à ChatConversation (individuel):', {
          conversation,
          conversationId: conversation._id,
          otherParticipant,
          messages: mergedMessages,
          hasOnlineUser,
        });*/

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
      console.error('[CONVERSATIONS] Erreur lors de l’envoi des données au serveur:', error.message);
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
      console.warn('[CONVERSATIONS] Conversation invalide ou incomplète passée à getDisplayInfo:', conversation);
      return {
        name: 'Conversation inconnue',
        image: 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png',
        lastMessage: 'Aucun message',
        time: '',
        fullDate: '',
        hasOnlineUser: false,
        feedback: { message: '', emoji: '😐' },
      };
    }

    const hasOnlineUser = conversation.participants?.some(
      (p) => p?._id !== currentUserId && p.isOnline
    ) || false;
    const defaultMessage = conversation.messages?.length === 0
      ? 'Aucun message'
      : 'Nouveau message';

    if (!conversation.lastMessage) {
      console.warn(`[CONVERSATIONS] Conversation ${conversation._id} sans lastMessage, utilisation de la valeur par défaut`);
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
        feedback: conversation.lastMessage?.feedback || { message: '', emoji: '😐' },
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
        feedback: conversation.lastMessage?.feedback || { message: '', emoji: '😐' },
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
      feedback: conversation.lastMessage?.feedback || { message: '', emoji: '😐' },
    };
  };

  const toggleNotifications = async () => {
    console.log('[NOTIFICATIONS] Toggle notifications, nouvel état:', !showNotifications);
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      try {
        const response = await axios.post(
          'http://localhost:5000/MessengerRoute/notifications/mark-as-read',
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
            },
          }
        );
        console.log('[NOTIFICATIONS] Succès: Notifications marquées comme lues:', response.data);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      } catch (error) {
        console.error('[NOTIFICATIONS] Erreur lors du marquage des notifications comme lues:', error.message);
      }
    }
  };

  const clearNotifications = () => {
    console.log('[NOTIFICATIONS] Effacement de toutes les notifications');
    setNotifications([]);
    setShowNotifications(false);
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  //console.log('[CONVERSATIONS] ===== RENDU DES CONVERSATIONS =====');
  //console.log('[CONVERSATIONS] Total des conversations:', conversations.length);
  //console.log('[CONVERSATIONS] Conversations actuelles:', conversations);
 // console.log('[CONVERSATIONS] État des messages non lus au rendu:', unseenMessages);
  //console.log('[NOTIFICATIONS] Notifications actuelles:', notifications);

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
          <div className="header-icon notification-icon" ref={notificationRef}>
            <FontAwesomeIcon
              icon={faBell}
              onClick={toggleNotifications}
              className={notifications.length > 0 ? 'active' : ''}
            />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  <button onClick={clearNotifications}>Effacer tout</button>
                </div>
                {notifications.length === 0 ? (
                  <p>Aucune notification</p>
                ) : (
                  <ul>
                    {notifications.map((notification, index) => (
                      <li key={index}>
                        <p>
                          {notification.type === 'recommendation' ? '💡 ' : '⚠️ '}
                          {notification.message}
                        </p>
                        <small>{new Date(notification.timestamp).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
          const { name, image, lastMessage, time, fullDate, hasOnlineUser, feedback } = getDisplayInfo(conversation);
          const isUnseen = unseenMessages[conversation._id] === true;

          console.log(`[CONVERSATIONS] Conversation ${conversation._id}:`, {
            name,
            isUnseen,
            lastMessage: truncateMessage(lastMessage),
            feedback
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
                  {feedback.message && (
                    <span className="chat-feedback" style={{ fontStyle: 'italic', color: '#888' }}>
                      {feedback.emoji} {truncateMessage(feedback.message, 30)}
                    </span>
                  )}
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