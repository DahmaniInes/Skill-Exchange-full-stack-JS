import { useState, useEffect } from "react";
import ProfileService from "../../services/ProfileService";
import PersonalInfoPage from "./PersonalInfoPage";
import ProfessionalInfoPage from "./ProfessionalInfoPage";
import EducationPage from "./EducationPage";
import SkillsPage from './SkillsPage';
import SocialLinksPage from './SocialLinksPage';
import SettingsPage from './SettingsPage';
import { X, Save } from "lucide-react";
import "./UserProfileForm.css";

const ProfileForm = ({ onCancel }) => {
  const [formData, setFormData] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const totalSteps = 6;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await ProfileService.getUserProfile();
        const normalizedData = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          profilePicture: data.profilePicture || "",
          jobTitle: data.jobTitle || "",
          company: data.company || "",
          experience: data.experience || [],
          skills: data.skills || [],
          socialLinks: data.socialLinks || {},
          privacySettings: {
            isProfilePublic: data.privacySettings?.isProfilePublic ?? true, // Default to true if undefined
            isDiscoverable: data.privacySettings?.isDiscoverable ?? true, // Default to true if undefined
          },
          notifications: {
            emailNotifications: data.notifications?.emailNotifications ?? true,
            pushNotifications: data.notifications?.pushNotifications ?? true,
            skillRequests: data.notifications?.skillRequests ?? true,
          },
        
        };
        console.log("ProfileForm - Normalized formData:", normalizedData);
        setFormData(normalizedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Tableau de dépendances vide

  const handleChange = (field, value) => {
    console.log(`ProfileForm - handleChange - ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await ProfileService.updatePersonalInfo(formData);
      onCancel(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (saved) => {
    console.log("ProfileForm handleCancel called with saved:", saved);
    onCancel(saved);
  };

  const handleNextStep = () => {
    console.log("ProfileForm - Current step:", step);
    console.log("ProfileForm - Setting step to:", step + 1);
    setStep(prevStep => {
      const newStep = prevStep + 1;
      console.log("ProfileForm - New step:", newStep);
      return newStep;
    });
  };

  const handlePrevStep = () => {
    console.log("ProfileForm - Current step:", step);
    console.log("ProfileForm - Setting step to:", step - 1);
    setStep(prevStep => {
      const newStep = prevStep - 1;
      console.log("ProfileForm - New step:", newStep);
      return newStep;
    });
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!formData) return null;

  return (
    <div className="security-container">
      <div className="security-header">
        <h2>Profile Editing</h2>
        <div className="header-actions">
          <button className="btn secondary" onClick={() => handleCancelClick(false)}>
            <X size={16} /> Cancel
          </button>
          <button 
            className="btn primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : <><Save size={16} /> Save</>}
          </button>
        </div>
      </div>

      <div className="form-navigation">
        {[...Array(totalSteps)].map((_, i) => (
          <button
            key={i+1}
            className={`step-button ${step === i+1 ? 'active' : ''}`}
            onClick={() => setStep(i+1)}
          >
            Step {i+1}
          </button>
        ))}
      </div>

      <div className="form-content">
        {step === 1 && (
          <PersonalInfoPage
            formData={formData}
            setFormData={setFormData}
            nextStep={handleNextStep}
            handleCancel={handleCancelClick}
          />
        )}

        {step === 2 && (
          <ProfessionalInfoPage
            formData={formData}
            handleChange={handleChange}
            nextStep={handleNextStep}
            prevStep={handlePrevStep}
          />
        )}

        {step === 3 && (
          <EducationPage
            formData={formData}
            setFormData={setFormData}
            nextStep={handleNextStep}
            prevStep={handlePrevStep}
            handleCancel={handleCancelClick}
          />
        )}

        {step === 4 && (
          <SkillsPage
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            nextStep={handleNextStep}
            prevStep={handlePrevStep}
            handleCancel={handleCancelClick}
          />
        )}

        {step === 5 && (
          <SocialLinksPage
            socialLinks={formData.socialLinks}
            handleChange={handleNestedChange}
            nextStep={handleNextStep}
            prevStep={handlePrevStep}
            handleCancel={handleCancelClick}
          />
        )}

        {step === 6 && (
          <SettingsPage
            privacySettings={formData.privacySettings}
            notifications={formData.notifications}
            handleChange={handleNestedChange}
            handleSubmit={handleSubmit}
            handleCancel={handleCancelClick}
            prevStep={handlePrevStep}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileForm;