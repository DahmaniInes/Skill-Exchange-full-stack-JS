const User = require('../Models/User'); 

exports.getUserXPAndLevel = async (req, res) => {
  const { userId } = req.params; // Getting userId from URL parameters

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user's XP and level
    res.status(200).json({
      xp: user.xp,
      level: user.level,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
