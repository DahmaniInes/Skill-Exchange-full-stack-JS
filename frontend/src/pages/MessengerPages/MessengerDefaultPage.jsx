import React, { useState, useEffect, useRef } from 'react';
import styles from './DefaultPageStylesMessenger.module.css';

const MessengerDefaultPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const userCardsRef = useRef([]);

  useEffect(() => {
    setIsLoaded(true);
    userCardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
      }
    });
  }, []);

  const premiumTeachers = [
    { id: 1, name: "Prof. Ahmed", status: "Expert en développement web", isPremium: true, online: false },
    { id: 2, name: "Prof. Sophie", status: "Spécialiste UX/UI", isPremium: true, online: true },
    { id: 3, name: "Prof. Karim", status: "Expert en sécurité informatique", isPremium: true, online: false },
    { id: 4, name: "Prof. Linda", status: "Formatrice en data science", isPremium: true, online: true }
  ];

  const communityUsers = [
    { id: 1, name: "Maria L.", status: "En ligne", isOnline: true },
    { id: 2, name: "Thomas K.", status: "En ligne", isOnline: true },
    { id: 3, name: "Amina H.", status: "Vu à 11:45", isOnline: false },
    { id: 4, name: "Lucas M.", status: "Vu à 10:30", isOnline: false },
    { id: 5, name: "Sarah B.", status: "En ligne", isOnline: true }
  ];

  const handleCardClick = (user) => {
    console.log(`Conversation ouverte avec ${user.name}`);
  };

  return (
    <div className={styles.messengerContainer}>
      <div className={`${styles.welcomeHeader} ${isLoaded ? styles.loaded : ''}`}>
        <h1>Bienvenue dans votre espace de discussion</h1>
        <p>Connectez-vous avec des formateurs ou d'autres apprenants en temps réel</p>
      </div>

      <div className={`${styles.actionButtons} ${isLoaded ? styles.loaded : ''}`}>
        <button className={styles.actionButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm-1 9h-2v2h-2V9H5V7h2V5h2v2h2v2z"/>
          </svg>
          Créer un groupe
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
            {premiumTeachers.map((teacher, index) => (
              <div
                key={teacher.id}
                className={styles.userCard}
                ref={(el) => (userCardsRef.current[index] = el)}
                onClick={() => handleCardClick(teacher)}
              >
                <div className={styles.userAvatar}>
                  <div className={styles.avatarPlaceholder}>{teacher.name.charAt(0)}</div>
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{teacher.name}</div>
                  <div className={styles.userStatus}>{teacher.status}</div>
                </div>
                <span className={`${styles.userBadge} ${styles.badgePremium}`}>Premium</span>
                {teacher.online && <div className={styles.activeDot}></div>}
              </div>
            ))}
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

          <div className={styles.userList}>
            {communityUsers.map((user, index) => (
              <div
                key={user.id}
                className={styles.userCard}
                ref={(el) => (userCardsRef.current[premiumTeachers.length + index] = el)}
                onClick={() => handleCardClick(user)}
              >
                <div className={styles.userAvatar}>
                  <div className={styles.avatarPlaceholder}>{user.name.charAt(0)}</div>
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={`${styles.userStatus} ${user.isOnline ? styles.online : ''}`}>{user.status}</div>
                </div>
                {user.isOnline && <div className={styles.activeDot}></div>}
              </div>
            ))}
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