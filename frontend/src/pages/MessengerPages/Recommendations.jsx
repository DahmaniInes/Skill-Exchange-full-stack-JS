import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import styles from './DefaultPageStylesMessenger.module.css'; // Réutiliser les styles existants

const Recommendations = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const recommendationCardsRef = useRef([]);
  const socketRef = useRef(null);

  // Initialisation et vérification du token
  useEffect(() => {
    console.log("=== INITIALISATION DE LA PAGE DES RECOMMANDATIONS ===");
    
    const token = localStorage.getItem('jwtToken');
    console.log('Token brut récupéré de localStorage :', token);

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Token décodé :', decoded);
        const userId = decoded.userId;
        if (!userId) {
          throw new Error('Aucun ID utilisateur trouvé dans le token (champ userId attendu)');
        }
        setCurrentUserId(userId);
        console.log('Utilisateur connecté identifié :', userId);
      } catch (err) {
        console.error('Erreur lors du décodage du token JWT:', err.message);
        setError('Token invalide ou corrompu');
      }
    } else {
      console.warn('Aucun token JWT trouvé dans localStorage');
      setError('Veuillez vous connecter');
    }

    socketRef.current = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket : Connexion réussie au serveur');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket : Erreur de connexion', error.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket : Déconnexion effectuée');
      }
    };
  }, []);

  // Authentification Socket.IO
  useEffect(() => {
    if (currentUserId && socketRef.current?.connected) {
      socketRef.current.emit('authenticate', currentUserId);
      console.log('Authentification Socket.IO émise pour :', currentUserId);
    }
  }, [currentUserId]);

  // Fonction pour charger les recommandations
  const fetchRecommendations = async () => {
    console.log("=== CHARGEMENT DES RECOMMANDATIONS ===");
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('Aucun token trouvé dans localStorage');
      setError('Veuillez vous connecter pour voir les recommandations');
      setIsLoaded(true);
      return;
    }

    try {
      console.log('Token envoyé :', token);
      const response = await fetch('http://localhost:5000/MessengerRoute/get-recommendations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Statut de la réponse :', response.status);
      const data = await response.json();
      console.log('Données reçues de l\'API :', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${data.message || response.statusText}`);
      }

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('La réponse de l\'API n\'est pas valide ou ne contient pas de tableau de recommandations');
      }

      setRecommendations(data.data);
      console.log('Recommandations reçues :', data.data);
      setIsLoaded(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations :', error.message);
      setError(error.message);
      setIsLoaded(true);
    }
  };

  // Récupération des recommandations
  useEffect(() => {
    if (currentUserId) {
      fetchRecommendations();
    }
  }, [currentUserId]);

  // Animation des cartes
  useEffect(() => {
    recommendationCardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
      }
    });
  }, [recommendations]);

  // Gestion du clic sur une recommandation
  const handleRecommendationClick = (recommendation) => {
    console.log(`Clic sur la recommandation : ${recommendation.group_name}`);
    // TODO : Implémenter la logique pour rejoindre le groupe ou afficher plus de détails
  };

  // Redirection vers MessengerPage
  const handleMessengerRedirect = () => {
    console.log('Redirection vers MessengerPage');
    window.location.href = 'http://localhost:5173/MessengerPage';
  };

  // Réessayer de charger les recommandations
  const handleRetry = () => {
    setIsLoaded(false);
    setError(null);
    fetchRecommendations();
  };

  return (
    <div className={styles.messengerContainer}>
      <div className={`${styles.welcomeHeader} ${isLoaded ? styles.loaded : ''}`}>
        <h1>Recommandations de Groupes</h1>
        <p>Découvrez des groupes adaptés à vos intérêts et compétences</p>
      </div>

      <div className={`${styles.actionButtons} ${isLoaded ? styles.loaded : ''}`}>
        <button className={styles.actionButton} onClick={handleMessengerRedirect}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
          </svg>
          Retour à Messenger
        </button>
      </div>

      <div className={styles.conversationsSection}>
        <div className={`${styles.sectionColumn} ${isLoaded ? styles.loaded : ''}`} style={{ animationDelay: '0.3s' }}>
          <div className={styles.sectionHeader}>
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
                <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
              </svg>
              Groupes Recommandés
              <span className={styles.badgeFree}>Gratuit</span>
            </h2>
          </div>

          {error ? (
            <div className={styles.errorMessage}>
              <p>Erreur : {error}</p>
              <button className={styles.actionButton} onClick={handleRetry}>
                Réessayer
              </button>
            </div>
          ) : !isLoaded ? (
            <p>Chargement des recommandations...</p>
          ) : recommendations.length > 0 ? (
            <div className={styles.userList}>
              {recommendations.map((recommendation, index) => (
                <div
                  key={recommendation.group_id}
                  className={styles.userCard}
                  ref={(el) => (recommendationCardsRef.current[index] = el)}
                  onClick={() => handleRecommendationClick(recommendation)}
                >
                  <div className={styles.userAvatar}>
                    <div className={styles.avatarPlaceholder}>
                      {recommendation.group_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{recommendation.group_name}</div>
                    <div className={styles.userStatus}>{recommendation.category}</div>
                    <div className={styles.userSkills}>
                      Compétences : {recommendation.skills.join(', ')}
                    </div>
                    <div className={styles.userSimilarity}>
                      Score de compatibilité : {(recommendation.similarity * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
              </svg>
              <h3>Aucune recommandation disponible</h3>
              <p>Envoyez plus de messages pour obtenir des recommandations personnalisées.</p>
              <button className={styles.actionButton} onClick={handleRetry}>
                Réessayer
              </button>
            </div>
          )}

          <div className={styles.sectionFooter}>
            <button className={styles.viewMoreBtn}>
              Voir plus
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;