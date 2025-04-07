import React, { useState, useEffect } from "react";
import { 
  Link as LinkIcon, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter, 
  PlusCircle, 
  ArrowRight, 
  Share2,
  Loader2
} from "lucide-react";
import ProfileService from "../../services/ProfileService";
import FormNavigationButtons from "./FormNavigationButtons";
import "./PersonalInfoPage.css";

const SocialPlatformInput = ({ 
  label, 
  type, 
  value, 
  fieldName, 
  handleChange, 
  placeholder, 
  icon: Icon, 
  brandColor,
  required = false, 
  validation,
  error
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="form-group social-input-group">
      <label className="form-label">
        {label} 
        {required && <span className="required-mark">*</span>}
      </label>
      <div 
        className={`social-input-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
        style={{ 
          borderColor: isFocused ? brandColor : '#e2e8f0',
          backgroundColor: isFocused ? `${brandColor}10` : '#f8fafc'
        }}
      >
        <div className="social-icon-wrapper" style={{ color: brandColor }}>
          <Icon size={20} />
        </div>
        <input
          type={type}
          className="social-input"
          value={value || ''}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
        />
        {value && !error && (
          <div className="validation-icon" style={{ color: brandColor }}>
            <ArrowRight size={16} />
          </div>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

const SocialLinksPage = ({ formData, handleChange, nextStep, prevStep }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [showOptionalLink, setShowOptionalLink] = useState(false);

  // Configuration des plateformes sociales
  const socialPlatforms = [
    {
      label: "Portfolio Website",
      fieldName: "portfolio",
      icon: Globe,
      brandColor: "#06BBCC",
      placeholder: "https://www.yourportfolio.com",
      pattern: /^(https?:\/\/)[\w.-]+\.[a-z]{2,}(\/\S*)?$/i
    },
    {
      label: "LinkedIn Profile",
      fieldName: "linkedin",
      icon: Linkedin,
      brandColor: "#0077B5",
      placeholder: "https://www.linkedin.com/in/yourprofile",
      pattern: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/
    },
    {
      label: "GitHub Profile",
      fieldName: "github",
      icon: Github,
      brandColor: "#333",
      placeholder: "https://github.com/yourusername",
      pattern: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/
    },
    {
      label: "Twitter Profile",
      fieldName: "twitter",
      icon: Twitter,
      brandColor: "#1DA1F2",
      placeholder: "https://twitter.com/yourusername",
      pattern: /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/
    }
  ];

  // Validation des URLs
  const validateURL = (value, platform) => {
    if (!value) return "";
    const platformConfig = socialPlatforms.find(p => p.fieldName === platform);
    return platformConfig?.pattern.test(value) ? "" : "URL invalide";
  };

  // Gestion des changements
  const handleSocialChange = (field, value) => {
    const error = validateURL(value, field);
    const updatedErrors = {
      ...formData.errors,
      [`socialLinks_${field}`]: error
    };
    
    const updatedSocialLinks = {
      ...formData.socialLinks,
      [field]: value
    };

    handleChange('socialLinks', updatedSocialLinks, updatedErrors);
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Appel du service
      const updatedProfile = await ProfileService.updateSocialLinks(
        formData.socialLinks
      );

      // Mise à jour des données
      handleChange('socialLinks', updatedProfile.socialLinks);
      nextStep();
    } catch (error) {
      // Gestion des erreurs serveur
      if (error.details) {
        const serverErrors = Object.entries(error.details).reduce((acc, [key, value]) => ({
          ...acc,
          [`socialLinks_${key}`]: value
        }), {});
        
        handleChange('errors', { ...formData.errors, ...serverErrors });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérification des erreurs
  const hasErrors = Object.keys(formData.errors || {}).some(
    key => key.startsWith('socialLinks_') && formData.errors[key]
  );

  return (
    <section className="personal-info-section">
      <h3 className="section-title">
        <Share2 size={24} className="section-icon" />
        Social & Professional Links
      </h3>

      <div className="form-grid">
        {socialPlatforms.map((platform) => (
          <SocialPlatformInput
            key={platform.fieldName}
            {...platform}
            value={formData.socialLinks[platform.fieldName] || ''}
            handleChange={handleSocialChange}
            error={formData.errors?.[`socialLinks_${platform.fieldName}`]}
            validation={(value) => validateURL(value, platform.fieldName)}
          />
        ))}
      </div>

      {!showOptionalLink ? (
        <div 
          className="add-optional-link"
          onClick={() => setShowOptionalLink(true)}
        >
          <PlusCircle size={16} />
          Add Custom Social Link
        </div>
      ) : (
        <div className="form-grid">
          <SocialPlatformInput
            label="Custom Social Link"
            fieldName="custom"
            type="url"
            value={formData.socialLinks.custom || ''}
            handleChange={handleSocialChange}
            placeholder="https://example.com/profile"
            icon={LinkIcon}
            brandColor="#6a5acd"
            error={formData.errors?.socialLinks_custom}
          />
        </div>
      )}

      <div className="navigation-container">
        <FormNavigationButtons
          nextStep={handleSubmit}
          prevStep={prevStep}
          nextDisabled={hasErrors || isSubmitting}
          customNext={
            <button 
              className="btn primary" 
              type="button"
              onClick={handleSubmit}
              disabled={hasErrors || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  Continue
                </>
              )}
            </button>
          }
        />
      </div>
    </section>
  );
};

export default SocialLinksPage;