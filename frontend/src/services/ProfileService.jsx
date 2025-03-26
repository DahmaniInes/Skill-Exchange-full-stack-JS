import axios from 'axios';

// Base Axios configuration with interceptor
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Interceptor to add authentication token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('jwtToken');
    console.log('Token winekk:', token); // Add this to check if token exists

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const ProfileService = {
  // Profile Information Methods
 

  updatePersonalInfo: async (personalData) => {
    try {
      const formData = new FormData();
      
      // Add text data
      Object.keys(personalData).forEach(key => {
        if (key !== 'profilePicture' && personalData[key] !== undefined) {
          formData.append(key, JSON.stringify(personalData[key]));
        }
      });

      // Add profile picture if present
      if (personalData.profilePicture) {
        const profilePictureFile = await fetch(personalData.profilePicture)
          .then(res => res.blob())
          .then(blob => new File([blob], 'profilePicture.jpg', { type: 'image/jpeg' }));
        
        formData.append('profilePicture', profilePictureFile);
      }

      const response = await api.put('/profile', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Erreur de mise à jour des informations personnelles');
    }
  },

  validatePersonalInfo: (formData) => {
    const errors = {};
    // First name validation
    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = "Prénom invalide (min 2 caractères)";
    }
    // Last name validation
    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = "Nom invalide (min 2 caractères)";
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = "Email invalide";
    }
    // Phone validation (optional)
    if (formData.phone) {
      const phoneRegex = /^\+?[\d\s()-]{8,20}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = "Numéro de téléphone invalide";
      }
    }
    // Location validation
    if (!formData.location || formData.location.length < 2) {
      errors.location = "Localisation invalide";
    }
    // Bio validation
    if (formData.bio && formData.bio.length < 50) {
      errors.bio = "La bio doit contenir au moins 50 caractères";
    }
    return errors;
  },

  // Password Methods
  updatePassword: async (oldPassword, newPassword) => {
    try {
      const response = await api.put('/me/password', { oldPassword, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Erreur de modification du mot de passe');
    }
  },

  // CV Methods


  // Experience Methods
  addExperience: async (experienceData) => {
    try {
      const response = await api.post('/experiences', experienceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Erreur d\'ajout d\'expérience');
    }
  },

  deleteExperience: async (experienceId) => {
    try {
      const response = await api.delete(`/experiences/${experienceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Erreur de suppression d\'expérience');
    }
  },

  // Education Methods
  addEducation: async (educationData) => {
    try {
      const response = await api.post('/educations', educationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Erreur d\'ajout de formation');
    }
  },

  validateEducation: (educationData) => {
    const errors = {};
    // School validation
    if (!educationData.school || educationData.school.length < 2) {
      errors.school = "Nom de l'école invalide (min 2 caractères)";
    }
    // Degree validation
    if (!educationData.degree || educationData.degree.length < 2) {
      errors.degree = "Diplôme invalide (min 2 caractères)";
    }
    // Field of study validation
    if (!educationData.fieldOfStudy || educationData.fieldOfStudy.length < 2) {
      errors.fieldOfStudy = "Domaine d'études invalide (min 2 caractères)";
    }
    // Start date validation
    if (!educationData.startDate) {
      errors.startDate = "Date de début requise";
    }
    // Check end date is not before start date
    if (educationData.startDate && educationData.endDate) {
      const start = new Date(educationData.startDate);
      const end = new Date(educationData.endDate);
      
      if (start > end) {
        errors.endDate = "La date de fin doit être postérieure à la date de début";
      }
    }
    return errors;
  },

  deleteEducation: async (educationId) => {
    try {
      const response = await api.delete(`/educations/${educationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Erreur de suppression de formation');
    }
  },

  getSkills: async () => {
    try {
      const response = await api.get('/me?fields=skills');
      return response.data.skills;
    } catch (error) {
      throw new Error('Erreur de récupération des compétences');
    }
  },

  addSkill: async (skill) => {
    try {
      const response = await api.post('/skills', skill);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur d\'ajout de compétence');
    }
  },

  deleteSkill: async (skillId) => {
    try {
      await api.delete(`/skills/${skillId}`);
      return skillId;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de suppression de compétence');
    }
  },

  // CV
  uploadCV: async (file) => {
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await api.post('/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de téléchargement du CV');
    }
  },

  deleteCV: async () => {
    try {
      await api.delete('/delete-cv');
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de suppression du CV');
    }
  },

  // Validation
  validateSkill: (skill) => {
    const errors = {};
    if (!skill.name?.match(/^[a-zA-ZÀ-ÿ0-9 .-]{2,}$/)) {
      errors.name = 'Nom invalide (min 2 caractères)';
    }
    if (!skill.yearsOfExperience || skill.yearsOfExperience < 0 || skill.yearsOfExperience > 50) {
      errors.yearsOfExperience = 'Expérience invalide (0-50 ans)';
    }
    return errors;
  } ,

  getUserProfile: async () => {
    try {
      const response = await api.get('/me?fields=all');
      return response.data;
    } catch (error) {
      throw new Error('Failed to load profile');
    }
  },

  updateProfile: async (updatedFields) => {
    try {
      const response = await api.put('/profile', updatedFields);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  },

  updatePrivacySettings: async (settings) => {
    try {
      const response = await api.put('/privacy-settings', settings);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Privacy update failed');
    }
  },
  // Profile Recommendations
  getProfileRecommendations: async () => {
    try {
      const response = await api.get('/profile-recommendations');
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Erreur de récupération des recommandations');
    }
  }
};

export default ProfileService;