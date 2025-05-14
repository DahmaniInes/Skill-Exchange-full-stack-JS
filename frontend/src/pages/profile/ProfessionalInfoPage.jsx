import React, { useState } from "react";
import PropTypes from "prop-types"; // Add PropTypes
import { Briefcase, Plus, Trash, Calendar } from "lucide-react";
import FormNavigationButtons from "./FormNavigationButtons";
import FormInput from "./FormInput";
import ProfileService from "../../services/ProfileService";
import "./PersonalInfoPage.css";

const ProfessionalInfoPage = ({ formData, handleChange, nextStep, prevStep, handleCancel }) => {
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [experienceErrors, setExperienceErrors] = useState({});
  const [loading, setLoading] = useState({ add: false, delete: null });
  const [apiError, setApiError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "Ongoing";
    const options = { year: "numeric", month: "short" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case "title":
      case "company":
        error = value.trim().length < 2 ? "Minimum 2 characters" : "";
        break;
      case "startDate":
        error = !value ? "Start date required" : "";
        break;
      case "endDate":
        error =
          value && new Date(value) <= new Date(newExperience.startDate)
            ? "Must be after the start date"
            : "";
        break;
      case "description":
        error = value && value.trim().length < 20 ? "Minimum 20 characters" : "";
        break;
      default:
        break;
    }
    return error;
  };

  const handleExperienceChange = (field, value) => {
    setNewExperience((prev) => ({ ...prev, [field]: value }));
    setExperienceErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const addExperience = async () => {
    const errors = Object.keys(newExperience).reduce(
      (acc, field) => ({ ...acc, [field]: validateField(field, newExperience[field]) }),
      {}
    );

    setExperienceErrors(errors);
    if (Object.values(errors).some((e) => e)) return;

    try {
      setLoading({ ...loading, add: true });
      setApiError(null);

      const addedExperience = await ProfileService.addExperience({
        ...newExperience,
        startDate: new Date(newExperience.startDate),
        endDate: newExperience.endDate ? new Date(newExperience.endDate) : null,
      });

      handleChange("experience", [...(formData.experience || []), addedExperience]);
      setNewExperience({
        title: "",
        company: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading({ ...loading, add: false });
    }
  };

  const removeExperience = async (index) => {
    const experienceId = formData.experience[index]._id;

    try {
      setLoading({ ...loading, delete: index });
      await ProfileService.deleteExperience(experienceId);
      handleChange(
        "experience",
        formData.experience.filter((_, i) => i !== index)
      );
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading({ ...loading, delete: null });
    }
  };

  const handleNextStep = () => {
    if (!formData.jobTitle?.trim() || !formData.company?.trim()) {
      setApiError("Please fill in all required fields.");
      return;
    }
    nextStep();
  };

  return (
    <section className="personal-info-section">
      <h3 className="section-title">
        <Briefcase size={20} className="section-icon" /> Professional Information
      </h3>

      {apiError && <div className="error-banner">{apiError}</div>}

      <div className="form-grid">
        <FormInput
          label="Current Position"
          type="text"
          value={formData.jobTitle || ""}
          fieldName="jobTitle"
          handleChange={handleChange}
          placeholder="Senior Developer"
          icon={<Briefcase size={16} className="input-icon" />}
          required={true}
        />

        <FormInput
          label="Company"
          type="text"
          value={formData.company || ""}
          fieldName="company"
          handleChange={handleChange}
          placeholder="Company Inc."
          required={true}
          icon={<Briefcase size={16} className="input-icon" />}
        />
      </div>

      <div className="experience-section">
        <h4 className="section-subtitle">
          <Briefcase size={18} className="subsection-icon" /> Professional Experience
        </h4>

        <div className="experience-list">
          {(formData.experience || []).map((exp, index) => (
            <div key={exp._id || index} className="experience-card">
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
            <Plus size={18} className="subsection-icon" /> Add an Experience
          </h5>

          <div className="form-grid">
            <FormInput
              label="Job Title"
              type="text"
              value={newExperience.title || ""}
              fieldName="title"
              handleChange={handleExperienceChange}
              placeholder="Full Stack Developer"
              error={experienceErrors.title}
              required={true}
            />

            <FormInput
              label="Company"
              type="text"
              value={newExperience.company || ""}
              fieldName="company"
              handleChange={handleExperienceChange}
              placeholder="Google USA"
              error={experienceErrors.company}
              required={true}
            />

            <FormInput
              label="Start Date"
              type="date"
              value={newExperience.startDate || ""}
              fieldName="startDate"
              handleChange={handleExperienceChange}
              icon={<Calendar size={16} className="input-icon" />}
              error={experienceErrors.startDate}
              required={true}
            />

            <FormInput
              label="End Date"
              type="date"
              value={newExperience.endDate || ""}
              fieldName="endDate"
              handleChange={handleExperienceChange}
              icon={<Calendar size={16} className="input-icon" />}
              error={experienceErrors.endDate}
            />

            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea
                className={`form-textarea ${experienceErrors.description ? "input-error" : ""}`}
                value={newExperience.description || ""}
                onChange={(e) => handleExperienceChange("description", e.target.value)}
                placeholder="Describe your responsibilities and achievements"
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
                  <>
                    <Plus size={16} /> Add
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="navigation-container">
        <FormNavigationButtons
          nextStep={handleNextStep}
          prevStep={prevStep}
          handleCancel={handleCancel}
          loading={loading.add || loading.delete !== null}
        />
      </div>
    </section>
  );
};

// Add PropTypes for validation
ProfessionalInfoPage.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
  prevStep: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired, // Ensure handleCancel is a required function
};

export default ProfessionalInfoPage;