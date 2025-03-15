const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../Models/User'); // Assurez-vous d'importer le modèle User
const router = express.Router();

// Route pour configurer TOTP
router.get('/setup-totp', (req, res) => {
    // Générer une clé secrète
    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauthUrl = secret.otpauth_url; // URL pour le QR Code
    
    // Générer un QR Code
    QRCode.toDataURL(otpauthUrl, (err, data_url) => {
        if (err) return res.status(500).send('Erreur lors de la génération du QR Code');
        res.json({ secret: secret.base32, qrCode: data_url });
    });
});

// Route pour vérifier le code TOTP
router.post('/verify-totp', async (req, res) => {
    const { token, secret } = req.body;
    
    // Valider le code TOTP
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Tolérance pour les délais
    });
    
    if (verified) {
        try {
            // Mettre à jour l'utilisateur dans la base de données
            await User.findByIdAndUpdate(
                req.session.userId, 
                {
                    authKeyTOTP: secret,
                    isTOTPEnabled: true
                }
            );

            res.json({ 
                success: true, 
                message: 'Authentification TOTP réussie !' 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la mise à jour de l\'utilisateur' 
            });
        }
    } else {
        res.status(401).json({ success: false, message: 'Code TOTP invalide' });
    }
});

module.exports = router;