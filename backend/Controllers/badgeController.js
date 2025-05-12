const Badge = require('../Models/Badge');

exports.getAllBadges = async (req, res) => {
  const { userId } = req.params;

  try {
    const badges = await Badge.find({ userId });

    if (badges.length === 0) {
      return res.status(404).json({ error: "No badges found for this user" });
    }

    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
