const express = require("express");
const router = express.Router();
const InternshipOffer = require("../Models/InternshipOffer");
const InternshipApplication = require("../Models/InternshipApplication");
const Skill = require("../Models/Skill");
const User = require("../Models/User");
const verifySession = require("../middleware/verifySession");
const { upload } = require("../Config/multerConfig");

// Middleware to attach full user object from req.userId
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

// Public route: Get all internship offers
router.get("/", async (req, res) => {
  try {
    const offers = await InternshipOffer.find()
      .populate("skills", "name categories imageUrl")
      .populate("createdBy", "firstName lastName email");

    res.status(200).json(offers);
  } catch (err) {
    console.error("Error fetching internship offers:", err);
    res
      .status(500)
      .json({ message: "Server error while retrieving internships." });
  }
});

// Get internship offers for the authenticated user (creator)
router.get("/my-offers", verifySession, attachUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const offers = await InternshipOffer.find({ createdBy: userId })
      .populate("skills", "name categories imageUrl")
      .populate("createdBy", "firstName lastName email");

    res.json(offers);
  } catch (err) {
    console.error("Error fetching offers for user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public route: Get internship offer by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await InternshipOffer.findById(id)
      .populate("skills", "name categories imageUrl")
      .populate("createdBy", "firstName lastName email");

    if (!offer) {
      return res.status(404).json({ message: "Internship offer not found" });
    }

    res.json(offer);
  } catch (err) {
    console.error("Error fetching internship by ID:", err);
    res
      .status(500)
      .json({ message: "Server error while retrieving internship." });
  }
});

// Create internship offer
router.post("/", verifySession, attachUser, async (req, res) => {
  try {
    if (req.user.role !== "entrepreneur") {
      return res
        .status(403)
        .json({ message: "Only entrepreneurs can create internship offers." });
    }

    const {
      title,
      entrepriseName,
      description,
      skills,
      location,
      duration,
      startDate,
      tasks,
    } = req.body;
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
      createdBy,
    });

    await offer.save();
    res
      .status(201)
      .json({ message: "Internship offer created successfully", offer });
  } catch (err) {
    console.error("Create offer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update internship offer
router.put("/:id", verifySession, attachUser, async (req, res) => {
  try {
    if (req.user.role !== "entrepreneur") {
      return res
        .status(403)
        .json({ message: "Only entrepreneurs can update internship offers." });
    }

    const offerId = req.params.id;
    const updateData = req.body;

    const offer = await InternshipOffer.findById(offerId);
    if (!offer)
      return res.status(404).json({ message: "Internship offer not found" });

    if (!offer.createdBy.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own offers" });
    }

    if (updateData.skills) {
      const validSkills = await Skill.find({ _id: { $in: updateData.skills } });
      if (validSkills.length !== updateData.skills.length) {
        return res.status(400).json({ message: "Some skill IDs are invalid." });
      }
    }

    if (updateData.tasks && !Array.isArray(updateData.tasks)) {
      return res.status(400).json({ message: "Tasks must be an array." });
    }

    const updatedOffer = await InternshipOffer.findByIdAndUpdate(
      offerId,
      updateData,
      { new: true }
    );
    res.json({ message: "Internship offer updated", offer: updatedOffer });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Error updating offer" });
  }
});

// Delete internship offer
router.delete("/:id", verifySession, attachUser, async (req, res) => {
  try {
    if (req.user.role !== "entrepreneur") {
      return res
        .status(403)
        .json({ message: "Only entrepreneurs can delete internship offers." });
    }

    const offerId = req.params.id;
    const offer = await InternshipOffer.findById(offerId);
    if (!offer)
      return res.status(404).json({ message: "Internship offer not found" });

    if (!offer.createdBy.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own offers" });
    }

    await InternshipOffer.findByIdAndDelete(offerId);
    res.json({ message: "Internship offer deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting offer" });
  }
});

// Apply to internship
router.post(
  "/apply",
  verifySession,
  attachUser,
  upload.single("cv"),
  async (req, res) => {
    try {
      const { internshipOfferId, coverLetter } = req.body;
      const student = req.user._id;

      if (!req.file || !req.file.path) {
        return res
          .status(400)
          .json({ message: "CV upload failed or not provided." });
      }

      if (req.user.role !== "student") {
        return res
          .status(403)
          .json({ message: "Only students can apply to internships." });
      }

      const alreadyApplied = await InternshipApplication.findOne({
        student,
        internshipOffer: internshipOfferId,
      });
      if (alreadyApplied) {
        return res
          .status(400)
          .json({ message: "Already applied to this internship." });
      }

      const application = new InternshipApplication({
        student,
        internshipOffer: internshipOfferId,
        coverLetter,
        cvUrl: req.file.path,
      });

      await application.save();
      res
        .status(201)
        .json({ message: "Application submitted successfully.", application });
    } catch (err) {
      console.error("Application error:", err);
      res.status(500).json({ message: "Error applying to internship" });
    }
  }
);


router.get(
  "/applications/by-entrepreneur",
  verifySession,
  attachUser,
  async (req, res) => {
    try {
      if (req.user.role !== "entrepreneur") {
        return res
          .status(403)
          .json({ message: "Only entrepreneurs can view their applications." });
      }

      // Step 1: Find offer IDs created by this entrepreneur
      const offers = await InternshipOffer.find({
        createdBy: req.user._id,
      }).select("_id");
      const offerIds = offers.map((offer) => offer._id);

      // Step 2: Find applications to those offers
      const applications = await InternshipApplication.find({
        internshipOffer: { $in: offerIds },
      })
        .populate("student", "firstName lastName email") // student details
        .populate("internshipOffer", "title entrepriseName"); // offer details

      res.json(applications);
    } catch (err) {
      console.error("Error fetching entrepreneur applications:", err);
      res
        .status(500)
        .json({ message: "Server error while fetching applications." });
    }
  }
);

// Update application status
router.put(
  "/applications/:id/status",
  verifySession,
  attachUser,
  async (req, res) => {
    try {
      const { status } = req.body;
      const { id } = req.params;

      const application = await InternshipApplication.findById(id).populate(
        "internshipOffer"
      );
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Ensure the logged-in user is the creator of the offer
      if (!application.internshipOffer.createdBy.equals(req.user._id)) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this application" });
      }

      application.status = status;
      await application.save();

      res.json({ message: "Application status updated", application });
    } catch (err) {
      console.error("Status update error:", err);
      res.status(500).json({ message: "Failed to update application status" });
    }
  }
);

// Get applications by student
router.get("/applications/student", verifySession, attachUser, async (req, res) => {
  try {
    const student = req.user._id;
    const applications = await InternshipApplication.find({ student }).populate(
      "internshipOffer"
    );
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

module.exports = router;
