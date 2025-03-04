const jwt = require('jsonwebtoken'); // Import jwt for token verification

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    req.userId = decoded.userId; // Attach user ID to request
    next();
  });
};

module.exports = verifyToken;
