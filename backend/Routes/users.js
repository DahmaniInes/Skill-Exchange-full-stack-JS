var express = require("express");
var bcrypt = require("bcryptjs");
var User = require("../Models/User");

var router = express.Router();

// User Login
router.post("/login", async (req, res) => {
  console.error("Erreur lors de la connexion :");
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  req.session.userId = user._id;
  res.json({ message: "Login successful", user });
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

// Check Authenticated User
router.get("/profile", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(req.session.userId);
  res.json(user);
});

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ firstName, lastName, email, password: hashedPassword });
  await user.save();
  res.send('Registration page'); 
});


// In your routes/users.js

router.get('/verify-session', (req, res) => {
  console.log('Session Data:', req.session);
  console.log('Cookies:', req.cookies); // Check if cookies are being received
  if (req.session.userId) {
    res.json({ success: true, message: "Session is active", userId: req.session.userId });
  } else {
    res.json({ success: false, message: "No active session found" });
  }
});



module.exports = router;
