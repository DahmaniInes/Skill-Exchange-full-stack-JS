import axios from "axios";

// Base Axios configuration with interceptor
const api = axios.create({
  baseURL: "http://localhost:5000/api/", // Ensure this matches your backend port
  headers: {
    "Content-Type": "application/json", // Default to JSON
  },
  timeout: 10000, // Add 10-second timeout to prevent hanging requests
});

// Interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    console.log("Token retrieved:", token); // Debug token

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message, error.response?.data);
    return Promise.reject(error);
  }
);

const ProfileService = {
  // Profile Information Methods
  getUserProfile: async ({ signal } = {}) => {
    try {
      const DEFAULT_AVATAR =
        "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg";
      const response = await api.get("/profile/me", { signal });
      console.log("Profile data:", response.data);
      const userData = response.data.data?.user || {};
      if (!userData.profilePicture || userData.profilePicture === "") {
        userData.profilePicture = DEFAULT_AVATAR;
      }
      return userData;
    } catch (error) {
      console.error("Erreur de récupération du profil:", error.message);
      throw error;
    }
  },

  updatePersonalInfo: async (personalData, { signal } = {}) => {
    try {
      const formData = new FormData();

      // Handle fields individually without stringifying arrays unnecessarily
      Object.keys(personalData).forEach((key) => {
        if (key === "skills" && Array.isArray(personalData[key])) {
          formData.append(key, JSON.stringify(personalData[key])); // Stringify arrays
        } else if (key !== "profilePicture" && personalData[key] !== undefined) {
          formData.append(key, personalData[key]); // Send as-is for non-array fields
        }
      });

      // Handle profilePicture if it's a string (URL) or a file
      if (personalData.profilePicture) {
        if (typeof personalData.profilePicture === "string") {
          const profilePictureFile = await fetch(personalData.profilePicture)
            .then((res) => res.blob())
            .then((blob) => new File([blob], "profilePicture.jpg", { type: "image/jpeg" }));
          formData.append("profilePicture", profilePictureFile);
        } else {
          formData.append("profilePicture", personalData.profilePicture);
        }
      }

      const response = await api.put("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal,
      });
      return response.data.data?.user;
    } catch (error) {
      throw error.response?.data || new Error("Erreur de mise à jour des informations personnelles");
    }
  },

  updateSocialLinks: async (socialLinks, { signal } = {}) => {
    try {
      const response = await api.put(
        "/profile",
        { socialLinks },
        {
          headers: { "Content-Type": "application/json" },
          signal,
        }
      );
      return response.data.data?.user;
    } catch (error) {
      throw error.response?.data || new Error("Erreur de mise à jour des liens sociaux");
    }
  },

  validatePersonalInfo: (formData) => {
    const errors = {};
    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = "Prénom invalide (min 2 caractères)";
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = "Nom invalide (min 2 caractères)";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = "Email invalide";
    }
    if (formData.phone) {
      const phoneRegex = /^\+?[\d\s()-]{8,20}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = "Numéro de téléphone invalide";
      }
    }
    if (!formData.location || formData.location.length < 2) {
      errors.location = "Localisation invalide";
    }
    if (formData.bio && formData.bio.length < 50) {
      errors.bio = "La bio doit contenir au moins 50 caractères";
    }
    return errors;
  },

  validatePassword: async (password, { signal } = {}) => {
    try {
      const response = await api.post("/profile/validate-password", { password }, { signal });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Mot de passe invalide");
    }
  },

  updatePassword: async (oldPassword, newPassword, { signal } = {}) => {
    try {
      const response = await api.put(
        "/profile/password",
        { oldPassword, newPassword },
        { signal }
      );
      return response.data;
    } catch (error) {
      console.error("Password update error:", error.response?.data || error.message);
      throw error.response?.data || new Error("Erreur de modification du mot de passe");
    }
  },

  // Skills Methods
  getSkills: async ({ signal } = {}) => {
    try {
      const response = await api.get("/profile/skills", { signal });
      return response.data.skills || [];
    } catch (error) {
      throw error.response?.data || new Error("Erreur de récupération des compétences");
    }
  },

  addSkill: async (skill, { signal } = {}) => {
    try {
      const response = await api.post("/profile/skills", skill, { signal });
      return response.data.data; // Expect the added skill
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erreur d'ajout de compétence");
    }
  },

  deleteSkill: async (skillId, { signal } = {}) => {
    try {
      const response = await api.delete(`/profile/skills/${skillId}`, { signal });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erreur de suppression de compétence");
    }
  },

  validateSkill: (skill) => {
    const errors = {};
    if (!skill.name?.match(/^[a-zA-ZÀ-ÿ0-9 .-]{2,}$/)) {
      errors.name = "Nom invalide (min 2 caractères)";
    }
    if (
      !skill.yearsOfExperience ||
      skill.yearsOfExperience < 0 ||
      skill.yearsOfExperience > 50
    ) {
      errors.yearsOfExperience = "Expérience invalide (0-50 ans)";
    }
    return errors;
  },

  // Experience Methods
  addExperience: async (experienceData, { signal } = {}) => {
    try {
      const response = await api.post("/profile/experiences", experienceData, { signal });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || new Error("Erreur d'ajout d'expérience");
    }
  },

  deleteExperience: async (experienceId, { signal } = {}) => {
    try {
      const response = await api.delete(`/profile/experiences/${experienceId}`, { signal });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Erreur de suppression d'expérience");
    }
  },

  // Education Methods
  addEducation: async (educationData, { signal } = {}) => {
    try {
      const response = await api.post("/profile/educations", educationData, { signal });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || new Error("Erreur d'ajout de formation");
    }
  },

  deleteEducation: async (educationId, { signal } = {}) => {
    try {
      const response = await api.delete(`/profile/educations/${educationId}`, { signal });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Erreur de suppression de formation");
    }
  },

  validateEducation: (educationData) => {
    const errors = {};
    if (!educationData.school || educationData.school.length < 2) {
      errors.school = "Nom de l'école invalide (min 2 caractères)";
    }
    if (!educationData.degree || educationData.degree.length < 2) {
      errors.degree = "Diplôme invalide (min 2 caractères)";
    }
    if (!educationData.fieldOfStudy || educationData.fieldOfStudy.length < 2) {
      errors.fieldOfStudy = "Domaine d'études invalide (min 2 caractères)";
    }
    if (!educationData.startDate) {
      errors.startDate = "Date de début requise";
    }
    if (educationData.startDate && educationData.endDate) {
      const start = new Date(educationData.startDate);
      const end = new Date(educationData.endDate);
      if (start > end) {
        errors.endDate = "La date de fin doit être postérieure à la date de début";
      }
    }
    return errors;
  },

  // Privacy and Notification Settings
  updatePrivacySettings: async (settings, { signal } = {}) => {
    try {
      const response = await api.put("/profile/privacy-settings", settings, { signal });
      return response.data.data?.user;
    } catch (error) {
      throw error.response?.data || new Error("Erreur de mise à jour des paramètres de confidentialité");
    }
  },

  updateNotificationPreferences: async (preferences, { signal } = {}) => {
    try {
      const response = await api.put("/profile/notifications", preferences, { signal });
      return response.data.data?.user;
    } catch (error) {
      throw error.response?.data || new Error("Erreur de mise à jour des préférences de notifications");
    }
  },

  // Profile Recommendations
  getProfileRecommendations: async ({ signal } = {}) => {
    try {
      const response = await api.get("/profile/profile-recommendations", { signal });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || new Error("Erreur de récupération des recommandations");
    }
  },
};

export default ProfileService;