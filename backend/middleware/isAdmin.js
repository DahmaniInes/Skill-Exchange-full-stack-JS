// middleware/isAdmin.js
const isAdmin = (req, res, next) => {
  // Assumes req.user is set by an authentication middleware (e.g., authMiddleware)
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }

  if (req.user.role === 'admin' || req.user.role === 'super-admin') {
    next(); // User is an admin, proceed to the next handler
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
};

module.exports = isAdmin;