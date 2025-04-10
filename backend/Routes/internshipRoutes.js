const express = require("express");
const router = express.Router();
const InternshipOffer = require("../Models/InternshipOffer");
const InternshipApplication = require("../Models/InternshipApplication");
const Skill = require("../Models/Skill");
const User = require("../Models/User");
const verifySession = require("../middleware/verifySession");
const { upload } = require("../Config/multerConfig");
const InternshipTaskProgress = require("../Models/InternshipTaskProgress");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const { v4: uuid } = require("uuid");

const cloudinary = require("../Config/cloudinaryConfig"); // your cloudinary v2 config

const uploadPdfBufferToCloudinary = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "certificates",
        public_id: publicId,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

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

    const offers = await InternshipOffer.find({ assignedTo: null })
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

      const offer = await InternshipOffer.findById(internshipOfferId);
      if (offer.assignedTo) {
        return res
          .status(403)
          .json({ message: "This internship has already been assigned." });
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

      if (status === "accepted") {
        const offer = await InternshipOffer.findById(
          application.internshipOffer._id
        );
        offer.assignedTo = application.student;
        await offer.save();

        await Promise.all(
          offer.tasks.map((task) =>
            InternshipTaskProgress.create({
              internshipOffer: offer._id,
              student: application.student,
              taskId: task._id,
              status: "not_started",
            })
          )
        );

        await InternshipApplication.updateMany(
          { internshipOffer: offer._id, _id: { $ne: application._id } },
          { $set: { status: "rejected" } }
        );
      }

      await application.save();

      res.json({ message: "Application status updated", application });
    } catch (err) {
      console.error("Status update error:", err);
      res.status(500).json({ message: "Failed to update application status" });
    }
  }
);

// Get applications by student
router.get(
  "/applications/student",
  verifySession,
  attachUser,
  async (req, res) => {
    try {
      const student = req.user._id;
      const applications = await InternshipApplication.find({
        student,
      }).populate("internshipOffer");
      res.json(applications);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }
);

// Get task progress for an assigned student
router.get(
  "/offers/:id/tasks/progress",
  verifySession,
  attachUser,
  async (req, res) => {
    try {
      const offer = await InternshipOffer.findById(req.params.id);
      if (!offer || !offer.assignedTo.equals(req.user._id)) {
        return res.status(403).json({ message: "Access denied." });
      }

      const progress = await InternshipTaskProgress.find({
        internshipOffer: offer._id,
        student: req.user._id,
      });

      const tasksWithProgress = offer.tasks.map((task) => {
        const prog = progress.find((p) => p.taskId.equals(task._id));
        return {
          ...task.toObject(),
          progress: prog ? prog.status : "not_started",
        };
      });

      res.json({
        tasks: tasksWithProgress,
        certificateUrl: offer.certificateUrl || null,
        internshipTitle: offer.title,
        isCompleted: offer.completed || false,
      });
    } catch (err) {
      console.error("Error fetching task progress:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// Update task progress
router.put(
  "/offers/:id/tasks/:taskId/status",
  verifySession,
  attachUser,
  async (req, res) => {
    try {
      const { id, taskId } = req.params;
      const { status } = req.body;

      if (!["not_started", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value." });
      }

      const offer = await InternshipOffer.findById(id);
      if (!offer || !offer.assignedTo.equals(req.user._id)) {
        return res.status(403).json({ message: "Access denied." });
      }

      const task = offer.tasks.id(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found." });
      }

      const updated = await InternshipTaskProgress.findOneAndUpdate(
        { internshipOffer: id, student: req.user._id, taskId },
        { status, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      res.json({ message: "Task status updated", progress: updated });
    } catch (err) {
      console.error("Error updating task progress:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/applications/:id/progress",
  verifySession,
  attachUser,
  async (req, res) => {
    try {
      const application = await InternshipApplication.findById(req.params.id)
        .populate("student", "firstName lastName")
        .populate("internshipOffer");

      if (
        !application ||
        !application.internshipOffer ||
        !application.student
      ) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (!application.internshipOffer.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const progress = await InternshipTaskProgress.find({
        internshipOffer: application.internshipOffer._id,
        student: application.student._id,
      });

      const mergedTasks = application.internshipOffer.tasks.map((task) => {
        const matchingProgress = progress.find((p) =>
          p.taskId.equals(task._id)
        );
        return {
          _id: task._id,
          title: task.title,
          description: task.description,
          progress: matchingProgress?.status || "not_started",
        };
      });

      res.json({
        studentName: `${application.student.firstName} ${application.student.lastName}`,
        internshipTitle: application.internshipOffer.title,
        internshipId: application.internshipOffer._id,
        certificateUrl: application.internshipOffer?.certificateUrl,
        tasks: mergedTasks,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error loading progress" });
    }
  }
);

router.post(
  "/offers/:id/complete",
  verifySession,
  attachUser,
  async (req, res) => {
    try {
      const offer = await InternshipOffer.findById(req.params.id)
        .populate("skills", "name")
        .populate("assignedTo", "firstName lastName email");

      if (!offer) return res.status(404).json({ message: "Offer not found" });
      if (!offer.createdBy.equals(req.user._id))
        return res.status(403).json({ message: "Unauthorized" });
      if (!offer.assignedTo)
        return res
          .status(400)
          .json({ message: "This internship is not assigned to any student" });

      // Validate all tasks are completed
      const progressEntries = await InternshipTaskProgress.find({
        internshipOffer: offer._id,
        student: offer.assignedTo._id,
      });

      const incomplete = progressEntries.some((p) => p.status !== "completed");
      if (progressEntries.length < offer.tasks.length || incomplete) {
        return res.status(400).json({
          message: "All tasks must be completed to finalize this internship.",
        });
      }

      // Generate PDF certificate in memory
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const publicId = `certificate_${uuid()}`;

          const uploadResult = await uploadPdfBufferToCloudinary(
            buffer,
            publicId
          );

          // Update offer with completion info
          offer.completed = true;
          offer.completionDate = new Date();
          offer.certificateUrl = uploadResult.secure_url;
          await offer.save();

          res.status(200).json({
            message:
              "Internship successfully completed. Certificate generated.",
            certificateUrl: uploadResult.secure_url,
          });
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          res
            .status(500)
            .json({ message: "Failed to upload certificate to Cloudinary." });
        }
      });

      // Write certificate content
      doc
        .fillColor("#333")
        .font("Times-Bold")
        .fontSize(26)
        .text("Certificate of Completion", {
          align: "center",
          underline: true,
        });

      doc.moveDown(2);

      doc
        .font("Times-Roman")
        .fontSize(14)
        .fillColor("black")
        .text("This is to certify that", {
          align: "center",
        });

      doc.moveDown(0.5);

      doc
        .font("Times-Bold")
        .fillColor("#0056b3")
        .fontSize(18)
        .text(`${offer.assignedTo.firstName} ${offer.assignedTo.lastName}`, {
          align: "center",
          underline: true,
        });

      doc.moveDown(1.5);

      doc
        .font("Times-Roman")
        .fontSize(14)
        .fillColor("black")
        .text("has successfully completed the internship titled", {
          align: "center",
        });

      doc.moveDown(0.5);

      doc
        .font("Times-Bold")
        .fillColor("#28a745")
        .fontSize(16)
        .text(`"${offer.title}"`, {
          align: "center",
          underline: true,
        });

      doc.moveDown(1.5);

      doc
        .font("Times-Roman")
        .fontSize(14)
        .fillColor("black")
        .text(
          `at ${offer.entrepriseName}, starting on ${new Date(
            offer.startDate
          ).toLocaleDateString()}.`,
          {
            align: "center",
          }
        );

      doc.moveDown(2);

      // Optional horizontal line separator
      doc
        .strokeColor("#cccccc")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();

      doc.moveDown(2);

      // Skills section
      doc
        .font("Times-Bold")
        .fontSize(14)
        .fillColor("black")
        .text("Skills Acquired:");
      doc.moveDown(0.5);

      doc
        .font("Times-Roman")
        .fontSize(12)
        .list(
          offer.skills.map((skill) => skill.name),
          { bulletRadius: 2 }
        );

      doc.moveDown(1.5);

      // Completion date
      doc
        .font("Times-Roman")
        .fontSize(12)
        .text(`Date of Completion: ${new Date().toLocaleDateString()}`);
      doc.end();
    } catch (err) {
      console.error("Error completing internship:", err);
      res.status(500).json({ message: "Server error completing internship" });
    }
  }
);

/**for the amdin */
router.get("/admin/internships", verifySession, attachUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  try {
    const internships = await InternshipOffer.find()
      .populate("createdBy", "firstName lastName email role")
      .populate("skills", "name")
      .populate("assignedTo", "firstName lastName email");

    res.json(internships);
  } catch (err) {
    console.error("Admin internships error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/applications", verifySession, attachUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  try {
    const applications = await InternshipApplication.find()
      .populate("student", "firstName lastName email")
      .populate("internshipOffer", "title entrepriseName createdBy")
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error("Admin applications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/internships/:offerId/student/:studentId/progress", verifySession, attachUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  const { offerId, studentId } = req.params;

  try {
    const offer = await InternshipOffer.findById(offerId).populate("skills", "name");

    if (!offer) return res.status(404).json({ message: "Internship not found" });

    const progress = await InternshipTaskProgress.find({
      internshipOffer: offer._id,
      student: studentId,
    });

    const tasksWithProgress = offer.tasks.map((task) => {
      const prog = progress.find((p) => p.taskId.equals(task._id));
      return {
        ...task.toObject(),
        progress: prog ? prog.status : "not_started",
      };
    });

    res.json({
      internship: offer.title,
      entreprise: offer.entrepriseName,
      startDate: offer.startDate,
      assignedTo: studentId,
      tasks: tasksWithProgress,
    });
  } catch (err) {
    console.error("Admin task progress error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/internships/completed", verifySession, attachUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  try {
    const completed = await InternshipOffer.find({ completed: true })
      .populate("assignedTo", "firstName lastName email")
      .select("title entrepriseName startDate completionDate certificateUrl assignedTo");

    res.json(completed);
  } catch (err) {
    console.error("Completed internships error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/dashboard-stats", verifySession, attachUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  try {
    const [
      totalInternships,
      assignedCount,
      completedCount,
      totalApplications,
      topAppliedOffers
    ] = await Promise.all([
      InternshipOffer.countDocuments(),
      InternshipOffer.countDocuments({ assignedTo: { $ne: null } }),
      InternshipOffer.countDocuments({ completed: true }),
      InternshipApplication.countDocuments(),
      InternshipApplication.aggregate([
        {
          $group: {
            _id: "$internshipOffer",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "internshipoffers",
            localField: "_id",
            foreignField: "_id",
            as: "offer"
          }
        },
        {
          $unwind: "$offer"
        },
        {
          $project: {
            title: "$offer.title",
            entrepriseName: "$offer.entrepriseName",
            count: 1
          }
        }
      ])
    ]);

    res.json({
      totalInternships,
      assignedCount,
      unassignedCount: totalInternships - assignedCount,
      completedCount,
      totalApplications,
      topAppliedOffers
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
});





module.exports = router;
