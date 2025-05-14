import React, { useState, useEffect } from "react";
import { User, Camera, Mail, Phone, MapPin, Edit3 } from "lucide-react";
import FormNavigationButtons from "./FormNavigationButtons";
import ProfileService from "../../services/ProfileService";
import "./PersonalInfoPage.css";

const ProfilePicture = ({ profilePicture, handleChange }) => {
  const [preview, setPreview] = useState(profilePicture);

  const handleFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        handleChange("profilePicture", file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-picture-wrapper">
      <label className="form-label">Profile Picture</label>
      <div className="profile-picture-container">
        <img
          src={preview || "/default-avatar.png"}
          alt="Profile"
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

const BioSection = ({ bio, handleChange, error }) => (
  <div className="bio-section">
    <label className="form-label">Biography</label>
    <div className="textarea-wrapper">
      <textarea
        className="form-textarea"
        value={bio || ""}
        onChange={(e) => handleChange("bio", e.target.value)}
        rows={5}
        placeholder="Tell us about yourself..."
        minLength={50}
      />
      <Edit3 size={16} className="textarea-icon" />
    </div>
    {error && <span className="error-message">{error}</span>}
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
  error,
}) => {
  console.log(`Input ${fieldName} value:`, value);

  return (
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
          value={value || ""}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

const PersonalInfoPage = ({ formData, setFormData, nextStep, handleCancel }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [localFormData, setLocalFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    profilePicture: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setFetchLoading(true);
        const data = await ProfileService.getUserProfile();
        console.log("Fetched profile data:", data);

        const normalizedData = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          profilePicture: data.profilePicture || "",
        };

        console.log("Normalized data:", normalizedData);
        setLocalFormData(normalizedData);
        setFormData(normalizedData);
      } catch (error) {
        console.error("Error loading profile:", error);
        setErrors({ global: "Failed to load profile" });
      } finally {
        setFetchLoading(false);
      }
    };
    loadProfile();
  }, [setFormData]);

  const handleChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);

    setLocalFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    const fieldValidation = ProfileService.validatePersonalInfo({
      ...localFormData,
      [field]: value,
    });

    setErrors((prev) => ({
      ...prev,
      [field]: fieldValidation[field] || "",
    }));
  };

  const handleNextStep = () => {
    console.log("🔵 handleNextStep called with data:", localFormData);

    const validationErrors = ProfileService.validatePersonalInfo(localFormData);
    console.log("Validation errors:", validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      console.log("🔴 Validation errors found:", validationErrors);
      setErrors(validationErrors);
      return;
    }

    console.log("Calling nextStep...");
    nextStep();
  };

  const handleCancelClick = () => {
    console.log("🔵 handleCancelClick called");
    handleCancel(false);
  };

  if (fetchLoading) {
    return <div className="spinner-container"><div className="spinner"></div></div>;
  }

  return (
    <section className="personal-info-section">
      <h3 className="section-title">Personal Information</h3>

      {errors.global && <div className="error-banner">{errors.global}</div>}

      <div className="centered-profile">
        <ProfilePicture
          profilePicture={localFormData.profilePicture}
          handleChange={handleChange}
        />
      </div>

      <div className="form-grid">
        <FormInput
          label="First Name"
          type="text"
          value={localFormData.firstName}
          fieldName="firstName"
          handleChange={handleChange}
          placeholder="Your first name"
          required={true}
          error={errors.firstName}
        />

        <FormInput
          label="Last Name"
          type="text"
          value={localFormData.lastName}
          fieldName="lastName"
          handleChange={handleChange}
          placeholder="Your last name"
          required={true}
          error={errors.lastName}
        />
      </div>

      <div className="bio-container">
        <BioSection
          bio={localFormData.bio}
          handleChange={handleChange}
          error={errors.bio}
        />
      </div>

      <div className="form-grid">
        <FormInput
          label="Email"
          type="email"
          value={localFormData.email}
          fieldName="email"
          handleChange={handleChange}
          placeholder="email@example.com"
          icon={<Mail size={16} className="input-icon" />}
          required={true}
          error={errors.email}
        />

        <FormInput
          label="Phone"
          type="tel"
          value={localFormData.phone}
          fieldName="phone"
          handleChange={handleChange}
          placeholder="+33 6 12 34 56 78"
          icon={<Phone size={16} className="input-icon" />}
          error={errors.phone}
        />

        <FormInput
          label="Location"
          type="text"
          value={localFormData.location}
          fieldName="location"
          handleChange={handleChange}
          placeholder="City, Country"
          icon={<MapPin size={16} className="input-icon" />}
          required={true}
          error={errors.location}
        />
      </div>

      <div className="navigation-container">
        <FormNavigationButtons
          nextStep={handleNextStep}
          handleCancel={handleCancelClick}
          loading={loading}
        />
      </div>
    </section>
  );
};

export default PersonalInfoPage;