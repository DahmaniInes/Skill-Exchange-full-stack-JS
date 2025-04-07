// middleware/verifySession.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // N'oubliez pas d'importer mongoose

const verifySession = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.jwt;
  
  if (!token) {
    return res.status(401).json({ 
      status: 'error',
      code: 'MISSING_TOKEN',
      message: 'Authentification requise'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérification supplémentaire
    if (!decoded?.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_PAYLOAD',
        message: 'Structure de token invalide'
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Session invalide ou expirée'
    });
  }
};

module.exports = verifySession;