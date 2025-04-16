import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './totpSetup.css';

const TotpSetup = () => {
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(''); // pour les styles de message
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
            setMessage('Erreur lors de la récupération du QR Code');
            setStatus('error');
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
            setStatus(response.data.success ? 'success' : 'error');
            if (response.data.success) {
                setTimeout(() => navigate('/'), 1500);
            }
        })
        .catch(error => {
            setMessage(error.response?.data?.message || 'Erreur de vérification');
            setStatus('error');
        });
    };
    
    return (
        <div className="totp-container">
            <h1>Configurer l'authentification à deux facteurs</h1>
            
            {qrCode && (
                <div className="qr-container">
                    <img src={qrCode} alt="QR Code" />
                </div>
            )}
            
            {secret && (
                <div className="secret-key">
                    <p>Clé secrète : {secret}</p>
                </div>
            )}
            
            <h2>Vérifier votre code</h2>
            <div className="input-group">
                <input
                    type="text"
                    placeholder="Entrez le code TOTP"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                />
                <button onClick={verifyToken}>Vérifier</button>
            </div>
            
            {message && (
                <div className={`message ${status}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default TotpSetup;