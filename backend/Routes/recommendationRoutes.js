const express = require('express');
const { recommendForStudent } = require('../services/recommender');
const User = require('../Models/User');
const verifySession = require('../middleware/verifySession');

const router = express.Router();

const attachUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Attach user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

router.get('/recommend', verifySession, attachUser, async (req, res) => {
  try {
    const studentId = req.user._id;

    const recommendedInternships = await recommendForStudent(studentId);

    if (recommendedInternships.length === 0) {
      return res.status(200).json([]);
    }

    res.json(recommendedInternships);
  } catch (err) {
    console.error('Recommendation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
