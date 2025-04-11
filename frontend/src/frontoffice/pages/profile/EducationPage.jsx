import React, { useState, useEffect } from "react";
import { GraduationCap, Plus, Trash, Calendar } from "lucide-react";
import FormNavigationButtons from "./FormNavigationButtons";
import "./PersonalInfoPage.css";

const FormInput = ({ 
  label, 
  type, 
  value, 
  fieldName, 
  handleChange, 
  placeholder, 
  icon, 
  required = false, 
  validation 
}) => {
  const [error, setError] = useState("");
  
  const validateInput = (value) => {
    if (!required && !value.trim()) return ""; // Ignore validation si champ non requis et vide
    if (required && !value.trim()) return `${label} est requis`;
    return validation ? validation(value) : "";
  };
  
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const errorMsg = validateInput(newValue);
    setError(errorMsg);
    handleChange(fieldName, newValue, errorMsg);
  };
  
  return (
    <div className="form-group">
      <label className="form-label">
        {label} 
        {required && <span className="required-mark">*</span>}
      </label>
      <div className="input-wrapper">
        {icon && icon}
        <input
          type={type}
          className={`form-input ${icon ? "with-icon" : ""} ${error ? "input-error" : ""}`}
          value={value}
          onChange={handleInputChange}
          onBlur={() => setError(validateInput(value))}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error}
        />
      </div>
      {error && <span className="error-message" aria-live="polite">{error}</span>}
    </div>
  );
};

const EducationPage = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {
  const [newEducation, setNewEducation] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: ""
  });

  const [newEducationErrors, setNewEducationErrors] = useState({
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: ''
  });

  const [dateError, setDateError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  // Fonctions de validation
  const validateSchool = (value) => (
    /^[a-zA-ZÀ-ÿ0-9 .-]{3,}$/.test(value) ? "" : "Nom d'établissement invalide (min 3 caractères)"
  );

  const validateDegree = (value) => (
    /^[a-zA-ZÀ-ÿ0-9 .-]{2,}$/.test(value) ? "" : "Nom de diplôme invalide (min 2 caractères)"
  );

  const validateFieldOfStudy = (value) => (
    /^[a-zA-ZÀ-ÿ0-9 .-]{3,}$/.test(value) ? "" : "Domaine d'étude invalide (min 3 caractères)"
  );

  const validateEndDate = (value) => {
    if (!value) return "";
    if (new Date(value) < new Date(newEducation.startDate)) {
      return "La date de fin ne peut pas être antérieure au début";
    }
    return "";
  };

  useEffect(() => {
    const dateErrorMsg = validateDates(newEducation.startDate, newEducation.endDate);
    setDateError(dateErrorMsg);

    const requiredFieldsFilled = 
      newEducation.school.trim() && 
      newEducation.degree.trim() && 
      newEducation.fieldOfStudy.trim() && 
      newEducation.startDate.trim();

    const noErrors = Object.values(newEducationErrors).every(error => !error) && !dateErrorMsg;

    setIsFormValid(requiredFieldsFilled && noErrors);
  }, [newEducation, newEducationErrors]);

  const validateDates = (start, end) => {
    if (!start) return "La date de début est requise";
    if (end && new Date(start) > new Date(end)) return "La date de début doit être antérieure à la fin";
    return "";
  };

  const addEducation = () => {
    if (!isFormValid) return;

    const formattedEducation = {
      ...newEducation,
      startDate: new Date(newEducation.startDate),
      endDate: newEducation.endDate ? new Date(newEducation.endDate) : null
    };

    setFormData(prev => ({
      ...prev,
      education: [...prev.education, formattedEducation],
      errors: { ...prev.errors, education: "" }
    }));

    setNewEducation({
      school: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: ""
    });
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
      errors: { ...prev.errors, education: "" }
    }));
  };

  const validateBeforeNext = () => {
    if (formData.education.length === 0) {
      setFormData(prev => ({
        ...prev,
        errors: { ...prev.errors, education: "Veuillez ajouter au moins une formation" }
      }));
      return;
    }
    nextStep();
  };

  return (
    <section className="personal-info-section">
      <h3 className="section-title">
        <GraduationCap size={20} className="subsection-icon" /> Formations
      </h3>

      <div className="experience-list">
        {formData.education.map((edu, index) => (
          <div key={index} className="experience-card">
            <div className="card-header">
              <div>
                <h4 className="experience-title">{edu.degree} en {edu.fieldOfStudy}</h4>
                <p className="experience-company">{edu.school}</p>
                <p className="experience-dates">
                  {new Date(edu.startDate).toLocaleDateString('fr-FR', dateOptions)} - 
                  {edu.endDate ? 
                    new Date(edu.endDate).toLocaleDateString('fr-FR', dateOptions) : 
                    "Aujourd'hui"}
                </p>
              </div>
              <button 
                className="btn-danger" 
                onClick={() => removeEducation(index)}
                title="Supprimer la formation"
                aria-label={`Supprimer la formation ${edu.degree}`}
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-experience-form">
        <h4 className="form-subheader">
          <Plus size={16} className="subsection-icon" /> Ajouter une formation
        </h4>

        <div className="form-grid">
          <FormInput
            label="Établissement"
            type="text"
            value={newEducation.school}
            fieldName="school"
            handleChange={(field, value, error) => {
              setNewEducation(prev => ({...prev, [field]: value}));
              setNewEducationErrors(prev => ({...prev, [field]: error}));
            }}
            placeholder="Nom de l'établissement"
            required={true}
            validation={validateSchool}
          />

          <FormInput
            label="Diplôme"
            type="text"
            value={newEducation.degree}
            fieldName="degree"
            handleChange={(field, value, error) => {
              setNewEducation(prev => ({...prev, [field]: value}));
              setNewEducationErrors(prev => ({...prev, [field]: error}));
            }}
            placeholder="Ex: Licence, Master..."
            required={true}
            validation={validateDegree}
          />

          <FormInput
            label="Domaine d'étude"
            type="text"
            value={newEducation.fieldOfStudy}
            fieldName="fieldOfStudy"
            handleChange={(field, value, error) => {
              setNewEducation(prev => ({...prev, [field]: value}));
              setNewEducationErrors(prev => ({...prev, [field]: error}));
            }}
            placeholder="Ex: Informatique"
            required={true}
            validation={validateFieldOfStudy}
          />

          <FormInput
            label="Date de début"
            type="date"
            value={newEducation.startDate}
            fieldName="startDate"
            handleChange={(field, value, error) => {
              setNewEducation(prev => ({...prev, [field]: value}));
              setNewEducationErrors(prev => ({...prev, [field]: error}));
            }}
            required={true}
            icon={<Calendar size={16} className="input-icon" />}
          />

          <FormInput
            label="Date de fin (optionnel)"
            type="date"
            value={newEducation.endDate}
            fieldName="endDate"
            handleChange={(field, value, error) => {
              setNewEducation(prev => ({...prev, [field]: value}));
              setNewEducationErrors(prev => ({...prev, [field]: error}));
            }}
            validation={validateEndDate}
            icon={<Calendar size={16} className="input-icon" />}
          />

          {dateError && (
            <div className="form-group full-width" aria-live="polite">
              <span className="error-message">{dateError}</span>
            </div>
          )}
        </div>

        <div className="buttons-container">
          <button 
            className="button button-primary" 
            onClick={addEducation}
            disabled={!isFormValid}
            aria-disabled={!isFormValid}
          >
            <Plus size={16} /> Ajouter la formation
          </button>
        </div>
      </div>

      <div className="navigation-container">
        {formData.errors?.education && (
          <span className="error-message" aria-live="polite">
            {formData.errors.education}
          </span>
        )}
        <FormNavigationButtons 
          nextStep={validateBeforeNext}
          prevStep={prevStep}
        />
      </div>
    </section>
  );
};

export default EducationPage;