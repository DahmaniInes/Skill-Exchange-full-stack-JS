import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ResultPaiementPage.module.css';

const ConfirmPaiementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setError('ID de session manquant dans l\'URL');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/MessengerRoute/verify-checkout-session?session_id=${sessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setPaymentConfirmed(true);
        } else {
          setError(data.message || 'Erreur lors de la vérification du paiement');
        }
      } catch (err) {
        setError('Erreur réseau ou serveur indisponible');
        console.error('Erreur lors de la vérification du paiement :', err);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location]);

  const handleReturnClick = () => {
    navigate('/MessengerDefaultPage');
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <p>Vérification du paiement en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <h1 className={styles.title}>Erreur</h1>
          <p className={styles.message}>{error}</p>
          <button className={styles.returnButton} onClick={handleReturnClick}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!paymentConfirmed) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <h1 className={styles.title}>Paiement non confirmé</h1>
          <p className={styles.message}>
            Le paiement n'a pas été finalisé ou une erreur s'est produite.
          </p>
          <button className={styles.returnButton} onClick={handleReturnClick}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <div className={styles.checkmarkCircle}>
            <div className={styles.checkmark}></div>
          </div>
        </div>
        <h1 className={styles.title}>Paiement confirmé</h1>
        <p className={styles.message}>
          Merci pour votre achat ! Votre transaction a été traitée avec succès.
        </p>
        <p className={styles.orderInfo}>
          Un email de confirmation a été envoyé à votre adresse email.
        </p>
        <button className={styles.returnButton} onClick={handleReturnClick}>
          Retour
        </button>
      </div>
    </div>
  );
};

export default ConfirmPaiementPage;