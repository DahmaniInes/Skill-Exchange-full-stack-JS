const express = require('express');
const router = express.Router();
const InternshipOffer = require('../Models/InternshipOffer');
const InternshipApplication = require('../Models/InternshipApplication');
const Skill = require('../Models/Skill');
const User = require('../Models/User');
const verifySession = require('../middleware/verifySession');

// Middleware to attach full user object from req.userId
const attachUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Attach user error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create internship offer
router.post('/', verifySession, attachUser, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create internship offers." });
      }
  
      const { title, entrepriseName, description, skills, location, duration, startDate, tasks } = req.body;
      const createdBy = req.user._id;
  
      const validSkills = await Skill.find({ _id: { $in: skills } });
      if (validSkills.length !== skills.length) {
        return res.status(400).json({ message: "Some skill IDs are invalid." });
      }
  
      if (tasks && !Array.isArray(tasks)) {
        return res.status(400).json({ message: "Tasks must be an array." });
      }
  
      const offer = new InternshipOffer({
        title,
        entrepriseName,
        description,
        skills,
        location,
        duration,
        startDate,
        tasks,
        createdBy
      });
  
      await offer.save();
      res.status(201).json({ message: "Internship offer created successfully", offer });
    } catch (err) {
      console.error("Create offer error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update internship offer
  router.put('/:id', verifySession, attachUser, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update internship offers." });
      }
  
      const offerId = req.params.id;
      const updateData = req.body;
  
      const offer = await InternshipOffer.findById(offerId);
      if (!offer) return res.status(404).json({ message: 'Internship offer not found' });
  
      if (!offer.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'You can only edit your own offers' });
      }
  
      if (updateData.skills) {
        const validSkills = await Skill.find({ _id: { $in: updateData.skills } });
        if (validSkills.length !== updateData.skills.length) {
          return res.status(400).json({ message: 'Some skill IDs are invalid.' });
        }
      }
  
      if (updateData.tasks && !Array.isArray(updateData.tasks)) {
        return res.status(400).json({ message: "Tasks must be an array." });
      }
  
      const updatedOffer = await InternshipOffer.findByIdAndUpdate(offerId, updateData, { new: true });
      res.json({ message: 'Internship offer updated', offer: updatedOffer });
    } catch (err) {
      console.error('Update error:', err);
      res.status(500).json({ message: 'Error updating offer' });
    }
  });
  
  // Delete internship offer
  router.delete('/:id', verifySession, attachUser, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete internship offers." });
      }
  
      const offerId = req.params.id;
      const offer = await InternshipOffer.findById(offerId);
      if (!offer) return res.status(404).json({ message: 'Internship offer not found' });
  
      if (!offer.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'You can only delete your own offers' });
      }
  
      await InternshipOffer.findByIdAndDelete(offerId);
      res.json({ message: 'Internship offer deleted successfully' });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ message: 'Error deleting offer' });
    }
  });
  

// Apply to internship
router.post('/apply', verifySession, attachUser, async (req, res) => {
  try {
    const { internshipOfferId, cvUrl, coverLetter } = req.body;
    const student = req.user._id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: "Only students can apply to internships." });
    }

    const existingApplication = await InternshipApplication.findOne({ student, internshipOffer: internshipOfferId });
    if (existingApplication) {
      return res.status(400).json({ message: "Already applied to this internship." });
    }

    const application = new InternshipApplication({ student, internshipOffer: internshipOfferId, cvUrl, coverLetter });
    await application.save();

    res.status(201).json({ message: "Application submitted", application });
  } catch (err) {
    console.error("Application error:", err);
    res.status(500).json({ message: "Error applying to internship" });
  }
});

// Get applications by student
router.get('/applications', verifySession, attachUser, async (req, res) => {
  try {
    const student = req.user._id;
    const applications = await InternshipApplication.find({ student })
      .populate('internshipOffer');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

module.exports = router;
