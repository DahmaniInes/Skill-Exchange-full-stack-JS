// src/pages/MessengerPages/ConversationContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const ConversationContext = createContext();

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.log('ConversationProvider : Aucun token JWT trouvé');
      setSocketReady(false);
      return;
    }

    socketRef.current = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('ConversationProvider : Socket connecté');
      setSocketReady(true);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('ConversationProvider : Erreur de connexion au socket', error);
      setSocketReady(false);
    });

    socketRef.current.on('groupUpdated', (data) => {
      console.log('ConversationProvider : Mise à jour du groupe reçue', data);
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv._id === data.conversationId
            ? { ...conv, name: data.groupName, image: data.groupPhoto }
            : conv
        )
      );
      if (currentConversation?._id === data.conversationId) {
        setCurrentConversation((prev) => ({
          ...prev,
          name: data.groupName,
          image: data.groupPhoto,
        }));
      }
    });

    loadConversations();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('ConversationProvider : Socket déconnecté');
        setSocketReady(false);
      }
    };
  }, []); // Supprimer la dépendance sur currentConversation._id pour éviter des réinitialisations inutiles

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('http://localhost:5000/MessengerRoute/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setConversations(data.data || []); // Correction : utiliser data.data au lieu de data.conversations
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        setConversations,
        currentConversation,
        setCurrentConversation,
        loadConversations,
        socket: socketRef.current,
        socketReady,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};