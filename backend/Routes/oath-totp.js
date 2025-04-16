const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../Models/User');
const verifyToken = require('../middleware/verifySession');
const router = express.Router();

// Route pour configurer TOTP
router.get('/setup-totp', (req, res) => {
    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauthUrl = secret.otpauth_url;

    QRCode.toDataURL(otpauthUrl, (err, data_url) => {
        if (err) return res.status(500).send('Erreur lors de la génération du QR Code');
        res.json({ secret: secret.base32, qrCode: data_url });
    });
});

// Route pour vérifier le code TOTP (✅ ajout de verifyToken ici)
// Route pour vérifier le code TOTP
router.post('/verify-totp', verifyToken, async (req, res) => { // Ajoutez le middleware verifyToken ici
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
                req.userId, // Utilisez req.userId au lieu de verifyToken.req.userId
                {
                    authKeyTOTP: secret,
                    isTOTPEnabled: true
                },
                { new: true } // Option pour retourner le document modifié
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
