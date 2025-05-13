import React, { useState, useEffect } from "react";
import { Code, Plus, Trash } from "lucide-react"; // Removed Upload and FileText icons
import FormNavigationButtons from "./FormNavigationButtons";
import ProfileService from "../../services/ProfileService";
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
  validation,
  min,
  max,
  children,
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
        {type === "select" ? (
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

const levelDisplay = {
  Beginner: "Beginner",
  Intermediate: "Intermediate",
  Advanced: "Advanced",
};

const SKILL_LEVEL_OPTIONS = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

const SkillsPage = ({ formData, setFormData, handleChange, nextStep, prevStep, handleCancel }) => {
  const [newSkill, setNewSkill] = useState({
    name: "",
    level: "Beginner",
    yearsOfExperience: "",
  });
  const [loading, setLoading] = useState({ skill: false }); // Removed cv loading state
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skills = await ProfileService.getSkills();
        setFormData((prev) => ({
          ...prev,
          skills: skills || [],
        }));
      } catch (error) {
        console.error("Failed to load skills:", error.message);
        setError("Failed to load skills. Please try again.");
        setFormData((prev) => ({
          ...prev,
          skills: [],
        }));
      }
    };

    if (!Array.isArray(formData.skills) || formData.skills.length === 0) {
      fetchSkills();
    }
  }, [formData.skills, setFormData]);

  const validateSkillName = (value) =>
    /^[a-zA-ZÀ-ÿ0-9 .-]{2,}$/.test(value) ? "" : "Invalid skill name (min 2 characters)";

  const validateYears = (value) => {
    const years = Number(value);
    if (isNaN(years)) return "Must be a number";
    if (years < 0) return "Cannot be negative";
    if (years > 50) return "Maximum 50 years";
    return "";
  };

  const handleSkillAdd = async () => {
    const nameError = validateSkillName(newSkill.name);
    const yearsError = validateYears(newSkill.yearsOfExperience);

    if (nameError || yearsError) {
      return alert(nameError || yearsError);
    }

    try {
      setLoading((prev) => ({ ...prev, skill: true }));
      const addedSkill = await ProfileService.addSkill({
        ...newSkill,
        yearsOfExperience: Number(newSkill.yearsOfExperience),
      });
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), addedSkill],
      }));
      setNewSkill({ name: "", level: "Beginner", yearsOfExperience: "" });
    } catch (error) {
      alert("Error adding skill: " + error.message);
    } finally {
      setLoading((prev) => ({ ...prev, skill: false }));
    }
  };

  const handleSkillRemove = async (skillId) => {
    try {
      setLoading((prev) => ({ ...prev, skill: true }));
      await ProfileService.deleteSkill(skillId);
      setFormData((prev) => ({
        ...prev,
        skills: (prev.skills || []).filter((skill) => skill._id !== skillId),
      }));
    } catch (error) {
      alert("Error deleting skill: " + error.message);
    } finally {
      setLoading((prev) => ({ ...prev, skill: false }));
    }
  };

  return (
    <section className="personal-info-section">
      <h3 className="section-title">
        <Code size={20} className="subsection-icon" /> Skills
      </h3>

      {error && <div className="error-banner">{error}</div>}

      <div className="experience-list">
        {(formData.skills || []).map((skill) => (
          <div key={skill._id} className="experience-card">
            <div className="card-header">
              <div>
                <h4 className="experience-title">{skill.name}</h4>
                <p className="experience-company">
                  Level: {levelDisplay[skill.level] || skill.level}
                </p>
                <p className="experience-dates">
                  Experience: {skill.yearsOfExperience} years
                </p>
              </div>
              <button
                className="btn-danger"
                onClick={() => handleSkillRemove(skill._id)}
                title="Delete skill"
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
          <Plus size={16} className="subsection-icon" /> Add a Skill
        </h4>

        <div className="form-grid">
          <FormInput
            label="Skill Name"
            type="text"
            value={newSkill.name}
            fieldName="name"
            handleChange={(_, value) => setNewSkill((p) => ({ ...p, name: value }))}
            placeholder="E.g., React"
            required={true}
            validation={validateSkillName}
          />

          <FormInput
            label="Skill Level"
            type="select"
            value={newSkill.level}
            fieldName="level"
            handleChange={(_, value) => setNewSkill((p) => ({ ...p, level: value }))}
            required={true}
          >
            {SKILL_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormInput>

          <FormInput
            label="Years of Experience"
            type="number"
            value={newSkill.yearsOfExperience}
            fieldName="yearsOfExperience"
            handleChange={(_, value) =>
              setNewSkill((p) => ({ ...p, yearsOfExperience: value }))
            }
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
            {loading.skill ? "Adding..." : (
              <>
                <Plus size={16} /> Add Skill
              </>
            )}
          </button>
        </div>
      </div>

      <div className="navigation-container">
        <FormNavigationButtons nextStep={nextStep} prevStep={prevStep} handleCancel={handleCancel} />
      </div>
    </section>
  );
};

export default SkillsPage;