import React, { useState, useEffect } from "react";
import { User, Camera, Mail, Phone, MapPin, Edit3 } from "lucide-react";
import FormNavigationButtons from "./FormNavigationButtons";
import ProfileService from "../../services/ProfileService";
import "./PersonalInfoPage.css";

const ProfilePicture = ({ profilePicture, handleChange }) => {
  const [preview, setPreview] = useState(profilePicture);

  const handleFileChange = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      handleChange("profilePicture", file);
    };
    if (file) reader.readAsDataURL(file);
  };

  return (
    <div className="profile-picture-wrapper">
      <label className="form-label">Photo de profil</label>
      <div className="profile-picture-container">
        <img 
          src={preview || "/default-avatar.png"} 
          alt="Profil" 
          className="profile-preview" 
        />
        <input
          type="file"
          id="profile-picture"
          accept="image/*"
          className="hidden-input"
          onChange={(e) => handleFileChange(e.target.files[0])}
        />
        <label htmlFor="profile-picture" className="upload-button">
          <Camera size={16} />
        </label>
      </div>
    </div>
  );
};

const BioSection = ({ bio, handleChange }) => (
  <div className="bio-section">
    <label className="form-label">Biographie</label>
    <div className="textarea-wrapper">
      <textarea
        className="form-textarea"
        value={bio}
        onChange={(e) => handleChange("bio", e.target.value)}
        rows={5}
        placeholder="Parlez-nous de vous..."
        minLength={50}
      />
      <Edit3 size={16} className="textarea-icon" />
    </div>
  </div>
);

const FormInput = ({ 
  label, 
  type, 
  value, 
  fieldName, 
  handleChange, 
  placeholder, 
  icon, 
  required = false,
  error
}) => (
  <div className="form-group">
    <label className="form-label">
      {label} 
      {required && <span className="required-mark">*</span>}
    </label>
    <div className="input-wrapper">
      {icon}
      <input
        type={type}
        className={`form-input ${icon ? "with-icon" : ""} ${error ? "input-error" : ""}`}
        value={value}
        onChange={(e) => handleChange(fieldName, e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
    {error && <span className="error-message">{error}</span>}
  </div>
);

const PersonalInfoPage = ({ formData, setFormData, nextStep, handleCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await ProfileService.getUserProfile();
        setFormData(data);
      } catch (error) {
        setErrors({ global: "Erreur de chargement du profil" });
      }
    };
    loadProfile();
  }, []);

  const validateField = (field, value) => {
    const validations = {
      firstName: value.length < 2 ? "Minimum 2 caractères" : "",
      lastName: value.length < 2 ? "Minimum 2 caractères" : "",
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Email invalide" : "",
      phone: value && !/^\+?[\d\s()-]{8,20}$/.test(value) ? "Format invalide" : "",
      location: value.length < 3 ? "Localisation invalide" : "",
      bio: value.length < 20 ? "Minimum 20 caractères" : ""
    };
    return validations[field];
  };

  const handleChange = (field, value) => {
    const error = validateField(field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: error }
    }));
  };
  const handleSubmit = async () => {
    console.log("🔵 handleSubmit called!");
  
    const validationErrors = Object.entries(formData).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: validateField(key, value)
    }), {});
  
    if (Object.values(validationErrors).some(e => e)) {
      console.log("🔴 Validation errors:", validationErrors);
      setErrors(validationErrors);
      return;
    }
  
    try {
      setLoading(true);
      await ProfileService.updatePersonalInfo(formData);
      console.log("🟢 Profile updated successfully, going to next step...");
      nextStep();  // Passer à l'étape suivante après validation
    } catch (error) {
      console.log("🔴 Update failed:", error.message);
      setErrors({ global: error.message || "Erreur lors de la mise à jour" });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <section className="personal-info-section">
      <h3 className="section-title">Informations Personnelles</h3>
      
      {errors.global && (
        <div className="error-banner">{errors.global}</div>
      )}

      <div className="centered-profile">
        <ProfilePicture 
          profilePicture={formData.profilePicture} 
          handleChange={handleChange}
        />
      </div>

      <div className="form-grid">
        <FormInput
          label="Prénom"
          type="text"
          value={formData.firstName}
          fieldName="firstName"
          handleChange={handleChange}
          placeholder="Votre prénom"
          required={true}
          error={errors.firstName}
        />

        <FormInput
          label="Nom"
          type="text"
          value={formData.lastName}
          fieldName="lastName"
          handleChange={handleChange}
          placeholder="Votre nom"
          required={true}
          error={errors.lastName}
        />
      </div>

      <div className="bio-container">
        <BioSection 
          bio={formData.bio} 
          handleChange={handleChange}
        />
        {errors.bio && <span className="error-message">{errors.bio}</span>}
      </div>

      <div className="form-grid">
        <FormInput
          label="Email"
          type="email"
          value={formData.email}
          fieldName="email"
          handleChange={handleChange}
          placeholder="email@exemple.com"
          icon={<Mail size={16} className="input-icon" />}
          required={true}
          error={errors.email}
        />

        <FormInput
          label="Téléphone"
          type="tel"
          value={formData.phone}
          fieldName="phone"
          handleChange={handleChange}
          placeholder="+33 6 12 34 56 78"
          icon={<Phone size={16} className="input-icon" />}
          error={errors.phone}
        />

        <FormInput
          label="Localisation"
          type="text"
          value={formData.location}
          fieldName="location"
          handleChange={handleChange}
          placeholder="Ville, Pays"
          icon={<MapPin size={16} className="input-icon" />}
          required={true}
          error={errors.location}
        />
      </div>

      <div className="navigation-container">
        <FormNavigationButtons
          nextStep={handleSubmit}
          handleCancel={handleCancel}
          loading={loading}
        />
      </div>
    </section>
  );
};

export default PersonalInfoPage;