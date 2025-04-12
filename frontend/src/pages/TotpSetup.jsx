import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TotpSetup = () => {
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5000/auth/setup-totp', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            }
        })
        .then(response => {
            setQrCode(response.data.qrCode);
            setSecret(response.data.secret);
        })
        .catch(error => {
            console.error('Erreur lors de la récupération du QR Code', error);
        });
    }, [navigate]);

    const verifyToken = () => {
        axios.post('http://localhost:5000/auth/verify-totp', 
            { token: totpCode, secret },
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            }
        )
        .then(response => {
            setMessage(response.data.message);
            if (response.data.success) {
                setTimeout(() => navigate('/'), 100);
            }
        })
        .catch(error => {
            setMessage(error.response?.data?.message || 'Erreur de vérification');
        });
    };

    return (
        <div>
            <h1>Configurer TOTP</h1>
            {qrCode && <img src={qrCode} alt="QR Code" />}
            <p>Clé secrète : {secret}</p>

            <h2>Vérifier TOTP</h2>
            <input
                type="text"
                placeholder="Entrez le code TOTP"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
            />
            <button onClick={verifyToken}>Vérifier</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default TotpSetup;