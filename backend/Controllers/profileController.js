const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Outlook365",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Récupérer le profil de l'utilisateur
exports.getUserProfile = async (req, res) => {
  try {
    console.log("Fetching user profile...");
    const userId = req.userId;
    console.log("User ID from token:", userId);

    if (!userId) {
      console.error("No userId found in request");
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
    }

    const user = await User.findById(userId).select("-password");
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error("Error fetching user profile:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Télécharger un fichier (utilisé pour la route /upload dans skillRoutes.js)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    }
    const filePath = req.file.path; // Chemin local (ex: uploads/fichier-123.jpg)
    res.status(200).json({
      success: true,
      message: "Fichier téléchargé avec succès",
      url: filePath, // Retourne le chemin local
    });
  } catch (error) {
    console.error("Erreur lors de l'upload :", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'upload" });
  }
};

// Récupérer les compétences de l'utilisateur
exports.getSkills = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
    }
    const user = await User.findById(userId).select("skills");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, skills: user.skills || [] });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mettre à jour les informations personnelles
exports.updatePersonalInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = { ...req.body };

    // Si un fichier est téléchargé, ajoutez l'URL Cloudinary
    if (req.file) {
      console.log("Uploaded file:", req.file); // Debug: Log the file object
      updates.profilePicture = req.file.path; // req.file.path devrait contenir l'URL Cloudinary
    }

    // Vérifiez si skills est une chaîne JSON et parsez-la si nécessaire
    if (updates.skills && typeof updates.skills === "string") {
      try {
        updates.skills = JSON.parse(updates.skills);
      } catch (error) {
        console.error("Erreur lors du parsing de skills:", error);
        return res.status(400).json({ success: false, message: "Format de skills invalide" });
      }
    }

    // Validez les données si nécessaire (par exemple, assurez-vous que skills est un tableau)
    if (updates.skills && !Array.isArray(updates.skills)) {
      return res.status(400).json({ success: false, message: "Skills doit être un tableau" });
    }

    // Nettoyez socialLinks pour éviter les erreurs de validation
    if (updates.socialLinks) {
      const socialLinks = updates.socialLinks;
      updates.socialLinks = {
        portfolio: socialLinks.portfolio || null,
        github: socialLinks.github || null,
        linkedin: socialLinks.linkedin || null,
        twitter: socialLinks.twitter || null,
      };
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error("Error updating personal info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Mettre à jour le mot de passe
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new passwords are required",
      });
    }

    const passwordRequirements = [
      { test: newPassword.length >= 12, message: "Password must be at least 12 characters long" },
      { test: /[A-Z]/.test(newPassword), message: "Password must contain at least one uppercase letter" },
      { test: /[a-z]/.test(newPassword), message: "Password must contain at least one lowercase letter" },
      { test: /\d/.test(newPassword), message: "Password must contain at least one number" },
      { test: /[!@#$%^&*]/.test(newPassword), message: "Password must contain at least one special character" },
    ];

    const failedRequirements = passwordRequirements.filter((req) => !req.test);
    if (failedRequirements.length > 0) {
      return res.status(400).json({ success: false, message: failedRequirements[0].message });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    const dateTime = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Tentative d'envoi d'email sans bloquer le processus en cas d'échec
    try {
      await sendPasswordUpdateEmail(user, dateTime);
    } catch (error) {
      console.error("Error sending password update email:", error);
      // Continue l'exécution même si l'email échoue
    }

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Valider le mot de passe
exports.validatePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    res.status(200).json({ success: true, message: "Password validated successfully" });
  } catch (error) {
    console.error("Error validating password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Ajouter une expérience
exports.addExperience = async (req, res) => {
  try {
    const userId = req.userId;
    const experienceData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.experiences.push(experienceData);
    await user.save();

    res.status(201).json({ success: true, data: user.experiences[user.experiences.length - 1] });
  } catch (error) {
    console.error("Error adding experience:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Supprimer une expérience
exports.deleteExperience = async (req, res) => {
  try {
    const userId = req.userId;
    const { experienceId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.experiences = user.experiences.filter((exp) => exp._id.toString() !== experienceId);
    await user.save();

    res.status(200).json({ success: true, message: "Experience deleted successfully" });
  } catch (error) {
    console.error("Error deleting experience:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Ajouter une éducation
exports.addEducation = async (req, res) => {
  try {
    const userId = req.userId;
    const educationData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.educations.push(educationData);
    await user.save();

    res.status(201).json({ success: true, data: user.educations[user.educations.length - 1] });
  } catch (error) {
    console.error("Error adding education:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Supprimer une éducation
exports.deleteEducation = async (req, res) => {
  try {
    const userId = req.userId;
    const { educationId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.educations = user.educations.filter((edu) => edu._id.toString() !== educationId);
    await user.save();

    res.status(200).json({ success: true, message: "Education deleted successfully" });
  } catch (error) {
    console.error("Error deleting education:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Ajouter une compétence
exports.addSkill = async (req, res) => {
  try {
    const userId = req.userId;
    const skillData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.skills.push(skillData);
    await user.save();

    res.status(201).json({ success: true, data: user.skills[user.skills.length - 1] });
  } catch (error) {
    console.error("Error adding skill:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Supprimer une compétence
exports.deleteSkill = async (req, res) => {
  try {
    const userId = req.userId;
    const { skillId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.skills = user.skills.filter((skill) => skill._id.toString() !== skillId);
    await user.save();

    res.status(200).json({ success: true, message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mettre à jour les paramètres de confidentialité
exports.updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { profileVisibility, contactInfoVisibility } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        "privacySettings.isProfilePublic": profileVisibility,
        "privacySettings.isDiscoverable": contactInfoVisibility,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mettre à jour les préférences de notification
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const { email, push, skillOpportunities } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        "notifications.emailNotifications": email,
        "notifications.pushNotifications": push,
        "notifications.skillRequests": skillOpportunities,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Récupérer les recommandations de profil
exports.getProfileRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const recommendations = {
      skills: ["JavaScript", "React", "Node.js"],
      courses: ["Advanced React", "Node.js Masterclass"],
    };

    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error fetching profile recommendations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fonction pour envoyer un email de mise à jour du mot de passe
const sendPasswordUpdateEmail = async (user, dateTime) => {
  const mailOptions = {
    from: `"MindSpark" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Successfully Updated",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          body { 
            font-family: 'Poppins', Arial, sans-serif; 
            background-color: #f8f9fa; 
            margin: 0; 
            padding: 0; 
            color: #333333;
          }
          
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          }
          
          .header { 
            background-color: #06BBCC; 
            color: #ffffff; 
            text-align: center; 
            padding: 25px 20px; 
          }
          
          .logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
          }
          
          .logo {
            width: 120px;
            height: auto;
            border-radius: 8px;
          }
          
          .header h2 { 
            font-weight: 600;
            font-size: 24px;
            margin: 0;
          }
          
          .content { 
            padding: 30px 25px; 
            color: #333333; 
          }
          
          .greeting {
            font-size: 18px;
            font-weight: 500;
          }
          
          .content p { 
            font-size: 16px; 
            line-height: 1.6; 
            margin: 15px 0; 
          }
          
          .warning { 
            background-color: #fff8f0; 
            border-left: 4px solid #ff7043; 
            padding: 15px; 
            margin: 20px 0; 
            font-size: 15px; 
            color: #333333; 
            border-radius: 0 8px 8px 0;
          }
          
          .buttons { 
            text-align: center; 
            margin: 30px 0; 
          }
          
          .button {
            display: inline-block; 
            padding: 12px 24px; 
            margin: 0 10px 10px 10px; 
            background-color: #06BBCC; 
            color: #ffffff !important; 
            text-decoration: none; 
            border-radius: 50px; 
            font-size: 15px; 
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(6, 187, 204, 0.3);
          }
          
          .button:hover {
            background-color: #059da9;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(6, 187, 204, 0.4);
          }
          
          .button.secondary { 
            background-color: #f0f0f0; 
            color: #333333 !important; 
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          
          .button.secondary:hover {
            background-color: #e0e0e0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          
          .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 25px 0;
          }
          
          .tips { 
            margin: 25px 0;
            background-color: #f8fdfd;
            padding: 20px;
            border-radius: 8px;
          }
          
          .tips h3 { 
            font-size: 18px; 
            color: #06BBCC; 
            margin-top: 0;
            margin-bottom: 15px; 
            font-weight: 600;
          }
          
          .tip-item { 
            font-size: 15px; 
            margin: 12px 0; 
            display: flex; 
            align-items: flex-start; 
          }
          
          .tip-icon {
            width: 22px;
            height: 22px;
            background-color: #06BBCC;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            margin-top: 2px;
            flex-shrink: 0;
          }
          
          .tip-icon svg {
            width: 12px;
            height: 12px;
            fill: white;
          }
          
          .support { 
            background-color: #f8f9fa; 
            padding: 25px; 
            border-top: 1px solid #e9ecef; 
          }
          
          .support h3 { 
            font-size: 17px; 
            color: #06BBCC; 
            margin-bottom: 15px; 
            font-weight: 600;
          }
          
          .support-item { 
            font-size: 15px; 
            margin: 10px 0; 
            display: flex; 
            align-items: center; 
          }
          
          .support-icon {
            margin-right: 10px;
            color: #06BBCC;
          }
          
          .support a { 
            color: #06BBCC; 
            text-decoration: none; 
          }
          
          .support a:hover { 
            text-decoration: underline; 
          }
          
          .social-links {
            text-align: center;
            padding: 20px 0;
            background-color: #f0f9fa;
          }
          
          .social-icon {
            display: inline-block;
            margin: 0 8px;
            width: 32px;
            height: 32px;
            background-color: #06BBCC;
            border-radius: 50%;
            color: white;
            line-height: 32px;
            font-size: 16px;
            text-align: center;
            text-decoration: none;
          }
          
          .app-links {
            display: flex;
            justify-content: center;
            margin-top: 15px;
          }
          
          .app-button {
            display: inline-block;
            margin: 0 8px;
            padding: 8px 16px;
            background-color: #333;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-size: 13px;
            display: flex;
            align-items: center;
          }
          
          .app-button svg {
            margin-right: 6px;
          }
          
          .footer { 
            text-align: center; 
            padding: 15px; 
            background-color: #06BBCC; 
            font-size: 13px; 
            color: rgba(255, 255, 255, 0.8);
          }
          
          .footer a { 
            color: #ffffff; 
            text-decoration: none; 
            margin: 0 5px; 
          }
          
          .footer a:hover {
            text-decoration: underline;
          }
          
          @media only screen and (max-width: 480px) {
            .container {
              margin: 10px;
              width: auto;
            }
            
            .buttons a {
              display: block;
              margin: 10px auto;
              max-width: 200px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <img src="cid:mindspark-logo" class="logo" alt="MindSpark Logo" />
            </div>
            <h2>Password Successfully Updated</h2>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${user.firstName || "User"},</p>
            
            <p>We're confirming that your account password was successfully changed on <strong>${dateTime}</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong> If you did not request this password change, your account may be compromised. Please take immediate action to secure it.
            </div>
            
            <div class="buttons">
              <a href="https://mindspark.com/verify-account" class="button">Verify Account</a>
              <a href="https://mindspark.com/reset-password" class="button secondary">Reset Password</a>
            </div>
            
            <div class="divider"></div>
            
            <div class="tips">
              <h3>Keeping Your Account Secure</h3>
              
              <div class="tip-item">
                <div class="tip-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="white"/>
                  </svg>
                </div>
                <span>Use strong passwords: Create unique passwords with a mix of letters, numbers, and symbols.</span>
              </div>
              
              <div class="tip-item">
                <div class="tip-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="white"/>
                  </svg>
                </div>
                <span>Enable two-factor authentication: Add an extra layer of security to your account.</span>
              </div>
              
              <div class="tip-item">
                <div class="tip-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="white"/>
                  </svg>
                </div>
                <span>Review recent activity: Regularly check your account for unfamiliar actions.</span>
              </div>
            </div>
          </div>
          
          <div class="support">
            <h3>Need Assistance?</h3>
            
            <div class="support-item">
              <span class="support-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#06BBCC">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </span>
              <span>Email: <a href="mailto:support@mindspark.com">support@mindspark.com</a></span>
            </div>
            
            <div class="support-item">
              <span class="support-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#06BBCC">
                  <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                </svg>
              </span>
              <span>Help Center: <a href="https://mindspark.com/help">mindspark.com/help</a></span>
            </div>
            
            <div class="support-item">
              <span class="support-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#06BBCC">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </span>
              <span>Security Portal: <a href="https://mindspark.com/security">mindspark.com/security</a></span>
            </div>
          </div>
          
          <div class="social-links">
            <a href="https://facebook.com/mindspark" class="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
              </svg>
            </a>
            <a href="https://twitter.com/mindspark" class="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/mindspark" class="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z"/>
              </svg>
            </a>
            <a href="https://instagram.com/mindspark" class="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/>
              </svg>
            </a>
          </div>
          
          <div class="app-links">
            <a href="https://play.google.com/store" class="app-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Play Store
            </a>
            <a href="https://www.apple.com/app-store/" class="app-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
              </svg>
              App Store
            </a>
          </div>
          
          <div class="footer">
            <p>
              © ${new Date().getFullYear()} MindSpark. All rights reserved.
            </p>
            <p>
              <a href="https://mindspark.com/privacy">Privacy Policy</a> | 
              <a href="https://mindspark.com/terms">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: 'mindspark.jpg',
        path: 'C:/Users/dorsaf/Desktop/version/Skill-Exchange-full-stack-JS/backend/uploads/mindspark.jpg',
        cid: 'mindspark-logo'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password update email sent to:", user.email);
  } catch (error) {
    console.error("Error sending password update email:", error);
    throw new Error("Failed to send password update email");
  }
};