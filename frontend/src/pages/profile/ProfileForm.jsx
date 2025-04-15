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

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await ProfileService.getUserProfile();
        setFormData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Gestionnaire de changement générique
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gestion des objets imbriqués
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    try {
      setLoading(true);
      await ProfileService.updateProfile(formData);
      onCancel(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!formData) return null;

  return (
    <div className="security-container">
      <div className="security-header">
        <h2>Édition du profil</h2>
        <div className="header-actions">
          <button className="btn secondary" onClick={() => onCancel(false)}>
            <X size={16} /> Annuler
          </button>
          <button 
            className="btn primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : <><Save size={16} /> Sauvegarder</>}
          </button>
        </div>
      </div>

      {/* Navigation entre les étapes */}
      <div className="form-navigation">
        {[...Array(totalSteps)].map((_, i) => (
          <button
            key={i+1}
            className={`step-button ${step === i+1 ? 'active' : ''}`}
            onClick={() => setStep(i+1)}
          >
            Étape {i+1}
          </button>
        ))}
      </div>

      {/* Contenu des étapes */}
      <div className="form-content">
      {step === 1 && (
  <PersonalInfoPage
    formData={formData}
    setFormData={setFormData}
    nextStep={() => setStep(step + 1)}  // Passer la fonction nextStep
    handleCancel={onCancel}
  />
)}

        {step === 2 && (
          <ProfessionalInfoPage
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {step === 3 && (
          <EducationPage
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {step === 4 && (
          <SkillsPage
            skills={formData.skills}
            handleChange={handleChange}
          />
        )}

        {step === 5 && (
          <SocialLinksPage
            socialLinks={formData.socialLinks}
            handleChange={handleNestedChange}
          />
        )}

        {step === 6 && (
          <SettingsPage
            privacySettings={formData.privacySettings}
            notifications={formData.notifications}
            handleChange={handleNestedChange}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileForm;
