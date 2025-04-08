import React, { useState, useEffect } from "react";
import { Briefcase, Plus, Trash, Calendar } from "lucide-react";
import FormNavigationButtons from "./FormNavigationButtons";
import FormInput from "./FormInput";
import ProfileService from "../../services/ProfileService";
import "./PersonalInfoPage.css";

const ProfessionalInfoPage = ({ formData, handleChange, nextStep, prevStep }) => {
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    description: ""
  });

  const [experienceErrors, setExperienceErrors] = useState({});
  const [loading, setLoading] = useState({ add: false, delete: null });
  const [apiError, setApiError] = useState(null);

  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return 'En cours';
    const options = { year: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Validation commune
  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case 'title':
      case 'company':
        error = value.trim().length < 2 ? `Minimum 2 caractères` : "";
        break;
      case 'startDate':
        error = !value ? "Date de début requise" : "";
        break;
      case 'endDate':
        error = value && new Date(value) <= new Date(newExperience.startDate) 
          ? "Doit être après la date de début" : "";
        break;
      case 'description':
        error = value && value.trim().length < 20 ? "Minimum 20 caractères" : "";
        break;
    }
    return error;
  };

  // Gestion des modifications
  const handleExperienceChange = (field, value) => {
    setNewExperience(prev => ({
      ...prev,
      [field]: value
    }));
    
    setExperienceErrors(prev => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  // Ajout d'expérience
  const addExperience = async () => {
    const errors = Object.keys(newExperience).reduce((acc, field) => ({
      ...acc,
      [field]: validateField(field, newExperience[field])
    }), {});

    setExperienceErrors(errors);
    if (Object.values(errors).some(e => e)) return;

    try {
      setLoading({ ...loading, add: true });
      setApiError(null);

      const addedExperience = await ProfileService.addExperience({
        ...newExperience,
        startDate: new Date(newExperience.startDate),
        endDate: newExperience.endDate ? new Date(newExperience.endDate) : null
      });

      handleChange("experience", [...formData.experience, addedExperience]);
      setNewExperience({ title: "", company: "", startDate: "", endDate: "", description: "" });
      
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading({ ...loading, add: false });
    }
  };

  // Suppression d'expérience
  const removeExperience = async (index) => {
    const experienceId = formData.experience[index]._id;
    
    try {
      setLoading({ ...loading, delete: index });
      await ProfileService.deleteExperience(experienceId);
      handleChange("experience", formData.experience.filter((_, i) => i !== index));
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading({ ...loading, delete: null });
    }
  };

  return (
    <section className="personal-info-section">
      <h3 className="section-title">
        <Briefcase size={20} className="section-icon" /> Informations Professionnelles
      </h3>

      {apiError && <div className="error-banner">{apiError}</div>}

      <div className="form-grid">
        <FormInput
          label="Poste actuel"
          type="text"
          value={formData.jobTitle || ""}
          fieldName="jobTitle"
          handleChange={handleChange}
          placeholder="Développeur Senior"
          icon={<Briefcase size={16} className="input-icon" />}
          required={true}
        />

        <FormInput
          label="Entreprise"
          type="text"
          value={formData.company || ""}
          fieldName="company"
          handleChange={handleChange}
          placeholder="Entreprise Inc."
          required={true}
          icon={<Briefcase size={16} className="input-icon" />}
        />
      </div>

      <div className="experience-section">
        <h4 className="section-subtitle">
          <Briefcase size={18} className="subsection-icon" /> Expériences Professionnelles
        </h4>

        <div className="experience-list">
          {formData.experience?.map((exp, index) => (
            <div key={exp._id} className="experience-card">
              <div className="card-header">
                <div>
                  <h5 className="experience-title">{exp.title}</h5>
                  <p className="experience-company">{exp.company}</p>
                </div>
                <button 
                  className="btn-danger" 
                  onClick={() => removeExperience(index)}
                  disabled={loading.delete === index}
                >
                  {loading.delete === index ? (
                    <div className="spinner-small"></div>
                  ) : (
                    <Trash size={16} />
                  )}
                </button>
              </div>
              <p className="experience-dates">
                {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
              </p>
              {exp.description && (
                <p className="experience-description">{exp.description}</p>
              )}
            </div>
          ))}
        </div>

        <div className="add-experience-form">
          <h5 className="form-subheader">
            <Plus size={18} className="subsection-icon" /> Ajouter une expérience
          </h5>

          <div className="form-grid">
            <FormInput
              label="Intitulé du poste"
              type="text"
              value={newExperience.title}
              fieldName="title"
              handleChange={handleExperienceChange}
              placeholder="Développeur Full Stack"
              error={experienceErrors.title}
              required={true}
            />

            <FormInput
              label="Entreprise"
              type="text"
              value={newExperience.company}
              fieldName="company"
              handleChange={handleExperienceChange}
              placeholder="Google France"
              error={experienceErrors.company}
              required={true}
            />

            <FormInput
              label="Date de début"
              type="date"
              value={newExperience.startDate}
              fieldName="startDate"
              handleChange={handleExperienceChange}
              icon={<Calendar size={16} className="input-icon" />}
              error={experienceErrors.startDate}
              required={true}
            />

            <FormInput
              label="Date de fin"
              type="date"
              value={newExperience.endDate}
              fieldName="endDate"
              handleChange={handleExperienceChange}
              icon={<Calendar size={16} className="input-icon" />}
              error={experienceErrors.endDate}
            />

            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea
                className={`form-textarea ${experienceErrors.description ? 'input-error' : ''}`}
                value={newExperience.description}
                onChange={(e) => handleExperienceChange('description', e.target.value)}
                placeholder="Décrivez vos missions et réalisations"
                rows={3}
              />
              {experienceErrors.description && (
                <span className="error-message">{experienceErrors.description}</span>
              )}
            </div>

            <div className="full-width">
              <button 
                className="button primary" 
                onClick={addExperience}
                disabled={loading.add || Object.values(experienceErrors).some(Boolean)}
              >
                {loading.add ? (
                  <div className="spinner-small"></div>
                ) : (
                  <><Plus size={16} /> Ajouter</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="navigation-container">
        <FormNavigationButtons
          nextStep={nextStep}
          prevStep={prevStep}
        />
      </div>
    </section>
  );
};

export default ProfessionalInfoPage;