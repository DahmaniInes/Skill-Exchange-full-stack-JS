const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
    
    // Accepter soit userId soit id
    const userIdentifier = decoded.userId || decoded.id;
    
    // Vérification supplémentaire
    if (!userIdentifier || !mongoose.Types.ObjectId.isValid(userIdentifier)) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_PAYLOAD',
        message: 'Structure de token invalide'
      });
    }
  
    // Utiliser l'identifiant trouvé
    req.userId = userIdentifier;
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