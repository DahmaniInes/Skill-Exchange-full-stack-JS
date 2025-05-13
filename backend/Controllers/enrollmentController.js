const Enrollment = require('../Models/Enrollment');
const Badge = require('../Models/Badge');
const User = require('../Models/User');

exports.updateProgress = async (req, res) => {
  try {
    const { userId, courseId, progress } = req.body;
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    enrollment.progress = progress;
    await enrollment.save();
    res.json({ message: "Progress updated successfully", progress: enrollment.progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    const enrollments = await Enrollment.find({ user: userId }).populate("course");

    const courses = enrollments.map(enrollment => ({
      courseId: enrollment.course._id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      progress: enrollment.progress,
      badgeClaimed: enrollment.badgeClaimed,
    }));

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.claimBadge = async (req, res) => {
  const { userId, courseId } = req.body;

  try {
    // Prevent duplicate badge claims
    const existingBadge = await Badge.findOne({ userId, courseId });
    if (existingBadge) {
      return res.status(400).json({ error: 'Badge already claimed' });
    }

    // Fetch course data to get title for badge display info
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create the Badge document with display info
    const badge = new Badge({
      userId,
      courseId,
      badgeName: `🎖️ ${course.title} Mastery Badge`,
      badgeDescription: `You successfully completed the "${course.title}" course!`,
      badgeIconUrl: 'https://example.com/badges/default-icon.png' // You can customize this per course if needed
    });

    await badge.save();

    // Find the user to update XP and level
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Define XP gain when the user completes a course
    const xpGain = 50;

    // Add XP to the user's current XP
    user.xp += xpGain;

    // Determine the user's level based on XP
    let newLevel = user.level;

    // Example threshold: 100 XP per level
    if (user.xp >= newLevel * 100) {
      newLevel = Math.floor(user.xp / 100) + 1;
    }

    user.level = newLevel;
    await user.save();

    // Return the response with the badge info and user stats
    res.status(200).json({
      message: 'Badge claimed and XP added',
      xp: user.xp,
      level: user.level,
      badge
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};