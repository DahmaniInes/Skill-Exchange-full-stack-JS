const express = require('express');
const router = express.Router();
const User = require('../Models/User');

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ level: -1, xp: -1 }) // Primary sort by level, secondary by XP
      .limit(10) // Top 10 users
      .select('firstName lastName xp level avatar'); // Return only necessary fields

    res.status(200).json(topUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

module.exports = router;
