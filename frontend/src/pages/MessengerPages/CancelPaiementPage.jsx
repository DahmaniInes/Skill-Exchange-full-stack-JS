import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ResultPaiementPage.module.css';

const handleReturnClick = () => {
    window.location.href = 'http://localhost:5173/MessengerDefaultPage';
    // Alternative avec react-router-dom si vous l'utilisez dans votre projet:
    // navigate('/MessengerDefaultPage');
  };
const CancelPaiementPage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <div className={styles.errorCircle}>
            <div className={styles.errorX}></div>
          </div>
        </div>
        <h1 className={styles.title}>Paiement annulé</h1>
        <p className={styles.message}>
          Votre transaction n'a pas été complétée.
        </p>
        <p className={styles.orderInfo}>
          Aucun montant n'a été débité de votre compte.
        </p>
        <button className={styles.returnButton} onClick={handleReturnClick}>
          Retour
        </button>
      </div>
    </div>
  );
};

export default CancelPaiementPage;