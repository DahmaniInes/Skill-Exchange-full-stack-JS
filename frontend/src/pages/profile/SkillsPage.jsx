import React, { useState } from "react";
import { Code, Plus, Trash, CheckCircle, Upload, FileText } from "lucide-react";
import FormNavigationButtons from "./FormNavigationButtons";
import "./PersonalInfoPage.css";
import ProfileService from "../../services/ProfileService";
// Reusable FormInput Component 
const FormInput = ({ 
    label, 
    type, 
    value, 
    fieldName, 
    handleChange, 
    placeholder, 
    icon, 
    required = false, 
    validation,
    min,
    max,
    children
  }) => {
    const [error, setError] = useState("");
    
    const validateInput = (value) => {
      if (required && !value.trim()) {
        return `${label} is required`;
      }
      
      if (validation && value) {
        return validation(value);
      }
      
      return "";
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
          {type === 'select' ? (
            <select
              className={`form-input ${icon ? "with-icon" : ""} ${error ? "input-error" : ""}`}
              value={value}
              onChange={handleInputChange}
              onBlur={() => setError(validateInput(value))}
              required={required}
            >
              {children}
            </select>
          ) : (
            <input
              type={type}
              className={`form-input ${icon ? "with-icon" : ""} ${error ? "input-error" : ""}`}
              value={value}
              onChange={handleInputChange}
              onBlur={() => setError(validateInput(value))}
              placeholder={placeholder}
              required={required}
              min={min}
              max={max}
            />
          )}
        </div>
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };
  
  // Composant SkillsPage séparé et correctement exporté
  const SkillsPage = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {
    const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];
    const [newSkill, setNewSkill] = useState({
      name: "",
      level: "Beginner",
      yearsOfExperience: ""
    });
    const [loading, setLoading] = useState({ skill: false, cv: false });
  
    useEffect(() => {
      const fetchSkills = async () => {
        try {
          const skills = await ProfileService.getSkills();
          setFormData(prev => ({ ...prev, skills }));
        } catch (error) {
          alert("Failed to load skills: " + error.message);
        }
      };
      
      if (!formData.skills.length) fetchSkills();
    }, []);
  
    const validateSkillName = (value) => {
      const skillNameRegex = /^[a-zA-ZÀ-ÿ0-9 .-]{2,}$/;
      return skillNameRegex.test(value) ? "" : "Invalid skill name (min 2 characters)";
    };
  
    const validateYears = (value) => {
      const years = Number(value);
      if (isNaN(years)) return "Must be a number";
      if (years < 0) return "Can't be negative";
      if (years > 50) return "Max 50 years";
      return "";
    };
  
    const handleSkillAdd = async () => {
      const nameError = validateSkillName(newSkill.name);
      const yearsError = validateYears(newSkill.yearsOfExperience);
      
      if (nameError || yearsError) return alert(nameError || yearsError);
  
      try {
        setLoading(prev => ({ ...prev, skill: true }));
        const addedSkill = await ProfileService.addSkill({
          ...newSkill,
          yearsOfExperience: Number(newSkill.yearsOfExperience)
        });
        
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, addedSkill]
        }));
        
        setNewSkill({
          name: "",
          level: "Beginner",
          yearsOfExperience: ""
        });
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(prev => ({ ...prev, skill: false }));
      }
    };
  
    const handleSkillRemove = async (index) => {
      try {
        setLoading(prev => ({ ...prev, skill: true }));
        await ProfileService.deleteSkill(formData.skills[index]._id);
        
        setFormData(prev => ({
          ...prev,
          skills: prev.skills.filter((_, i) => i !== index)
        }));
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(prev => ({ ...prev, skill: false }));
      }
    };
  
    const handleCVChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      if (file.type !== 'application/pdf') {
        return alert('Only PDF files allowed');
      }
  
      try {
        setLoading(prev => ({ ...prev, cv: true }));
        const result = await ProfileService.uploadCV(file);
        handleChange("cv", { name: file.name, url: result.url });
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(prev => ({ ...prev, cv: false }));
      }
    };
  
    const handleCVDelete = async () => {
      try {
        setLoading(prev => ({ ...prev, cv: true }));
        await ProfileService.deleteCV();
        handleChange("cv", null);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(prev => ({ ...prev, cv: false }));
      }
    };
  
    return (
      <section className="personal-info-section">
        <h3 className="section-title">
          <Code size={20} className="subsection-icon" /> Skills
        </h3>
  
        <div className="experience-list">
          {formData.skills.map((skill, index) => (
            <div key={skill._id} className="experience-card">
              <div className="card-header">
                <div>
                  <h4 className="experience-title">{skill.name}</h4>
                  <p className="experience-company">Level: {skill.level}</p>
                  <p className="experience-dates">
                    Experience: {skill.yearsOfExperience} years
                  </p>
                </div>
                <button
                  className="btn-danger"
                  onClick={() => handleSkillRemove(index)}
                  title="Remove Skill"
                  disabled={loading.skill}
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
  
        <div className="add-experience-form">
          <h4 className="form-subheader">
            <Plus size={16} className="subsection-icon" /> Add Skill
          </h4>
          
          <div className="form-grid">
            <FormInput
              label="Skill Name"
              type="text"
              value={newSkill.name}
              fieldName="name"
              handleChange={(_, value) => setNewSkill(p => ({ ...p, name: value }))}
              placeholder="Ex: React"
              required={true}
              validation={validateSkillName}
            />
  
            <FormInput
              label="Skill Level"
              type="select"
              value={newSkill.level}
              fieldName="level"
              handleChange={(_, value) => setNewSkill(p => ({ ...p, level: value }))}
              required={true}
            >
              {SKILL_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </FormInput>
  
            <FormInput
              label="Years of Experience"
              type="number"
              value={newSkill.yearsOfExperience}
              fieldName="years"
              handleChange={(_, value) => setNewSkill(p => ({ ...p, yearsOfExperience: value }))}
              placeholder="0-50"
              required={true}
              min="0"
              max="50"
              validation={validateYears}
            />
          </div>
  
          <div className="buttons-container">
            <button
              className="button button-primary"
              onClick={handleSkillAdd}
              disabled={loading.skill}
            >
              {loading.skill ? (
                'Adding...'
              ) : (
                <>
                  <Plus size={16} /> Add Skill
                </>
              )}
            </button>
          </div>
        </div>
  
        <div className="add-experience-form">
          <h4 className="form-subheader">
            <Upload size={16} className="subsection-icon" /> CV/Resume
          </h4>
          
          <div className="form-group">
            <label className="form-label">PDF File (Max 5MB)</label>
            <div className="experience-card">
              {formData.cv ? (
                <div className="card-header">
                  <div>
                    <h4 className="experience-title">
                      <FileText size={20} className="subsection-icon" /> 
                      {formData.cv.name}
                    </h4>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={handleCVDelete}
                    disabled={loading.cv}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ) : (
                <div className="file-upload-container">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden-input"
                    id="cv-upload"
                    onChange={handleCVChange}
                    disabled={loading.cv}
                  />
                  <label
                    htmlFor="cv-upload"
                    className={`button button-secondary ${loading.cv ? 'loading' : ''}`}
                  >
                    {loading.cv ? (
                      'Uploading...'
                    ) : (
                      <>
                        <Upload size={16} /> Select PDF
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
  
        <div className="navigation-container">
          <FormNavigationButtons
            nextStep={() => {
              if (formData.skills.length > 0) {
                nextStep();
              } else {
                alert("Please add at least one skill");
              }
            }}
            prevStep={prevStep}
          />
        </div>
      </section>
    );
  
  

};

export default SkillsPage;