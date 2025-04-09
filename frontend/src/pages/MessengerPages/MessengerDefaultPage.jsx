import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { loadStripe } from '@stripe/stripe-js';
import styles from './DefaultPageStylesMessenger.module.css';

const stripePromise = loadStripe('pk_test_51RBp5T2RFwWmT2NuEkuwiq7H4wwlPXmeQuHqWITY7aTtYga8Dgg7bY5GqlAHuk90uQQ46vkC3xr8DIc6A0YsS6i400YKnIyKhQ');

const MessengerDefaultPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [communityUsers, setCommunityUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [purchasedTeachers, setPurchasedTeachers] = useState([]);
  const userCardsRef = useRef([]);
  const socketRef = useRef(null);

  // Initialisation et vérification du token
  useEffect(() => {
    console.log("=== INITIALISATION DE MESSENGER DEFAULT PAGE ===");
    
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

    socketRef.current.on('userStatusUpdate', ({ userId, isOnline }) => {
      console.log(`Mise à jour statut reçue : ${userId} -> ${isOnline ? 'en ligne' : 'déconnecté'}`);
      setCommunityUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => {
          if (user.id === userId) {
            console.log(`Mise à jour de ${user.name} (communauté) : isOnline = ${isOnline}`);
            return { ...user, isOnline };
          }
          return user;
        });
        return updatedUsers;
      });
      setTeachers((prevTeachers) => {
        const updatedTeachers = prevTeachers.map((teacher) => {
          if (teacher.id === userId) {
            console.log(`Mise à jour de ${teacher.name} (formateur) : isOnline = ${isOnline}`);
            return { ...teacher, isOnline };
          }
          return teacher;
        });
        return updatedTeachers;
      });
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

  // Récupération des utilisateurs (formateurs et communauté) + purchasedTeachers
  useEffect(() => {
    const fetchUsers = async () => {
      console.log("=== CHARGEMENT DES UTILISATEURS ===");
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('Aucun token trouvé dans localStorage');
        setError('Veuillez vous connecter pour voir les utilisateurs');
        setIsLoaded(true);
        return;
      }

      try {
        console.log('Token envoyé :', token);
        const response = await fetch('http://localhost:5000/MessengerRoute/users', {
          method: 'GET',
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
          throw new Error('La réponse de l\'API n\'est pas valide ou ne contient pas de tableau d\'utilisateurs');
        }

        const filteredCommunityUsers = data.data
          .filter((user) => user.role === 'user' || user.role === 'student')
          .map((user) => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}${user._id === currentUserId ? ' (toi)' : ''}`,
            isOnline: user.isOnline || false,
            profilePicture: user.profilePicture || null,
          }));

        const filteredTeachers = data.data
          .filter((user) => user.role === 'teacher')
          .map((user) => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            status: user.status || 'Formateur',
            isPremium: true,
            isOnline: user.isOnline || false,
            profilePicture: user.profilePicture || null,
          }));

        const currentUser = data.data.find((user) => user._id === currentUserId);
        if (currentUser && currentUser.purchasedTeachers) {
          setPurchasedTeachers(currentUser.purchasedTeachers);
          filteredTeachers.forEach((teacher) => {
            if (currentUser.purchasedTeachers.includes(teacher.id)) {
              teacher.isPremium = false;
            }
          });
        }

        console.log('Utilisateurs communauté filtrés :', filteredCommunityUsers);
        console.log('Formateurs filtrés :', filteredTeachers);
        console.log('Formateurs débloqués :', purchasedTeachers);
        setCommunityUsers(filteredCommunityUsers);
        setTeachers(filteredTeachers);
        setIsLoaded(true);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error.message);
        setError(error.message);
        setIsLoaded(true);
      }
    };

    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  // Animation des cartes
  useEffect(() => {
    userCardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
      }
    });
  }, [communityUsers, teachers]);

  // Gestion du clic sur un utilisateur ou formateur
  const handleCardClick = async (user) => {
    if (user.isPremium) {
      console.log(`Clic sur le formateur ${user.name}, redirection vers Stripe...`);
      
      const stripe = await stripePromise;

      try {
        const response = await fetch('http://localhost:5000/MessengerRoute/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacherId: user.id,
            teacherName: user.name,
            studentId: currentUserId,
          }),
        });

        const session = await response.json();

        if (session.error) {
          throw new Error(session.error);
        }

        console.log('Session Stripe créée avec ID :', session.id);
        const result = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (result.error) {
          console.error('Erreur lors de la redirection Stripe :', result.error.message);
          setError(result.error.message);
        }
      } catch (error) {
        console.error('Erreur lors de la création de la session Checkout :', error.message);
        setError('Impossible de rediriger vers le paiement');
      }
    } else if (!user.isPremium && teachers.some(t => t.id === user.id)) {
      console.log(`Clic sur le formateur débloqué ${user.name}, aucune action pour le moment`);
    } else {
      console.log(`Conversation ouverte avec ${user.name}`);
    }
  };

  // Redirection vers MessengerPage
  const handleMessengerRedirect = () => {
    console.log('Redirection vers MessengerPage');
    window.location.href = 'http://localhost:5173/MessengerPage';
  };

  const getAvatarContent = (user) => {
    if (user.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={user.name}
          className={styles.avatarImage}
          onError={(e) => (e.target.src = 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png')}
        />
      );
    }
    return <div className={styles.avatarPlaceholder}>{user.name.charAt(0).toUpperCase()}</div>;
  };

  return (
    <div className={styles.messengerContainer}>
      <div className={`${styles.welcomeHeader} ${isLoaded ? styles.loaded : ''}`}>
        <h1>Bienvenue dans votre espace de discussion</h1>
        <p>Connectez-vous avec des formateurs ou d'autres apprenants en temps réel</p>
      </div>

      <div className={`${styles.actionButtons} ${isLoaded ? styles.loaded : ''}`}>
        <button className={styles.actionButton} onClick={handleMessengerRedirect}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
          </svg>
          Afficher dans Messenger
        </button>

        <button className={styles.actionButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
          Rechercher
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
              Formateurs
              <span className={styles.premiumBadge}>Premium</span>
            </h2>
          </div>

          <div className={styles.premiumNote}>
            Pour accéder aux conversations avec nos formateurs experts, un abonnement premium est requis.
          </div>

          <div className={styles.userList}>
            {teachers.length > 0 ? (
              teachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className={`${styles.userCard} ${!teacher.isPremium ? styles.unlockedCard : ''}`}
                  ref={(el) => (userCardsRef.current[index] = el)}
                  onClick={() => handleCardClick(teacher)}
                >
                  <div className={styles.userAvatar}>
                    {getAvatarContent(teacher)}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{teacher.name}</div>
                    <div className={styles.userStatus}>{teacher.status}</div>
                  </div>
                  <span className={`${styles.userBadge} ${teacher.isPremium ? styles.badgePremium : styles.badgeUnlocked}`}>
                    {teacher.isPremium ? 'Premium' : 'Débloqué'}
                  </span>
                </div>
              ))
            ) : (
              <p>Aucun formateur à afficher</p>
            )}
          </div>

          <div className={styles.sectionFooter}>
            <button className={styles.viewMoreBtn}>
              Voir plus
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={`${styles.sectionColumn} ${isLoaded ? styles.loaded : ''}`} style={{ animationDelay: '0.45s' }}>
          <div className={styles.sectionHeader}>
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
              Communauté
              <span className={styles.badgeFree}>Gratuit</span>
            </h2>
          </div>

          {error ? (
            <div className={styles.errorMessage}>
              <p>Erreur : {error}</p>
            </div>
          ) : !isLoaded ? (
            <p>Chargement des utilisateurs...</p>
          ) : (
            <div className={styles.userList}>
              {communityUsers.length > 0 ? (
                communityUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className={styles.userCard}
                    ref={(el) => (userCardsRef.current[teachers.length + index] = el)}
                    onClick={() => handleCardClick(user)}
                  >
                    <div className={styles.userAvatar}>
                      {getAvatarContent(user)}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user.name}</div>
                      <div className={`${styles.userStatus} ${user.isOnline ? styles.online : ''}`}>
                        {user.isOnline ? (
                          <span style={{ color: '#98FF98' }}>En ligne</span>
                        ) : (
                          'Déconnecté'
                        )}
                      </div>
                    </div>
                    {user.isOnline && <div className={styles.activeDot}></div>}
                  </div>
                ))
              ) : (
                <p>Aucun utilisateur à afficher</p>
              )}
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

        <div className={`${styles.sectionColumn} ${isLoaded ? styles.loaded : ''}`} style={{ animationDelay: '0.6s' }}>
          <div className={styles.sectionHeader}>
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Conversations récentes
            </h2>
          </div>

          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
            </svg>
            <h3>Aucune conversation récente</h3>
            <p>Commencez à discuter avec un formateur ou un autre membre de la communauté</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerDefaultPage;