import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TotpSetup = () => {
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Utiliser useNavigate pour la redirection

    // Récupérer le QR Code et la clé secrète
    useEffect(() => {
        axios.get('http://localhost:5000/auth/setup-totp')
            .then(response => {
                setQrCode(response.data.qrCode);
                setSecret(response.data.secret);
            })
            .catch(error => console.error('Erreur lors de la récupération du QR Code', error));
    }, []);

    // Valider le code TOTP
    const verifyToken = () => {
        axios.post('http://localhost:5000/auth/verify-totp', { token, secret })
            .then(response => {
                setMessage(response.data.message);
                if (response.data.success) {
                    // Rediriger vers la page d'accueil après un court délai
                    setTimeout(() => {
                        navigate('/'); // Redirection vers la page d'accueil
                    }, 100); // Délai de 1 seconde avant la redirection
                }
            })
            .catch(error => setMessage(error.response.data.message));
    };

    return (
        <div>
            <h1>Configurer TOTP</h1>
            {qrCode && <img src={qrCode} alt="QR Code" />} {/* Afficher l'image uniquement si qrCode est disponible */}
            <p>Clé secrète : {secret}</p>

            <h2>Vérifier TOTP</h2>
            <input
                type="text"
                placeholder="Entrez le code TOTP"
                value={token}
                onChange={(e) => setToken(e.target.value)}
            />
            <button onClick={verifyToken}>Vérifier</button>

            {message && <p>{message}</p>}
        </div>
    );
};

export default TotpSetup;