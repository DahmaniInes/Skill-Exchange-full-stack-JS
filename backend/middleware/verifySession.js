// middleware/verifySession.js

const verifySession = (req, res, next) => {
    console.log('Session Data:', req.session);
    console.log('Cookies:', req.cookies); // Debugging purposes
  
    if (req.session.userId) {
      next(); // User is authenticated, continue to the next middleware or route handler
    } else {
      res.status(401).json({ success: false, message: "Unauthorized - No active session" });
    }
  };
  
  module.exports = verifySession; // Export the middleware
  