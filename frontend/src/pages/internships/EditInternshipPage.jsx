import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../profile/PersonalInfoPage.css";

const EditInternshipPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    entrepriseName: "",
    description: "",
    duration: "",
    startDate: "",
    location: "",
    tasks: [{ title: "", description: "" }],
    selectedSkills: []
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [skillsRes, offerRes] = await Promise.all([
          axios.get("http://localhost:5000/api/skills"),
          axios.get(`http://localhost:5000/api/internships/my-offers`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const currentOffer = offerRes.data.find((o) => o._id === id);
        if (!currentOffer) return toast.error("Offer not found or unauthorized.");

        setSkills(skillsRes.data.data || []);
        setFormData({
          title: currentOffer.title,
          entrepriseName: currentOffer.entrepriseName,
          description: currentOffer.description,
          duration: currentOffer.duration,
          startDate: currentOffer.startDate?.split("T")[0] || "",
          location: currentOffer.location,
          tasks: currentOffer.tasks || [{ title: "", description: "" }],
          selectedSkills: currentOffer.skills.map((s) => s._id)
        });
      } catch (err) {
        toast.error("Failed to fetch data.");
      }
    };

    fetchData();
  }, [id]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.entrepriseName.trim()) errors.entrepriseName = "Entreprise Name is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.duration.trim()) errors.duration = "Duration is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (!formData.startDate.trim()) errors.startDate = "Start date is required";
    if (!Array.isArray(formData.selectedSkills) || formData.selectedSkills.length === 0) errors.selectedSkills = "At least one skill is required";
    formData.tasks.forEach((task, index) => {
      if (!task.title.trim() || !task.description.trim()) {
        if (!errors.tasks) errors.tasks = {};
        errors.tasks[index] = "Title and Description are required for each task";
      }
    });
    return errors;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index][field] = value;
    setFormData(prev => ({ ...prev, tasks: newTasks }));
  };

  const addTask = () => {
    setFormData(prev => ({ ...prev, tasks: [...prev.tasks, { title: "", description: "" }] }));
  };

  const removeTask = (index) => {
    const newTasks = [...formData.tasks];
    newTasks.splice(index, 1);
    setFormData(prev => ({ ...prev, tasks: newTasks }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please correct the errors in the form.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/internships/${id}`, {
        ...formData,
        skills: formData.selectedSkills
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Internship updated successfully.");
      navigate("/internships/entreprise");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating internship offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="personal-info-section">
      <h3 className="section-title">Edit Internship Offer</h3>
      <div style={{ marginBottom: "1rem" }}>
        <button
          className="button button-secondary"
          onClick={() => navigate("/internships/entreprise")}
          style={{ padding: "8px 16px", borderRadius: "6px" }}
        >
          ← Back to My Internships
        </button>
      </div>
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <input type="text" placeholder="Title" value={formData.title} onChange={e => handleChange("title", e.target.value)} />
            {formErrors.title && <span className="error-message">{formErrors.title}</span>}
          </div>

          <div className="form-group">
            <input type="text" placeholder="Entreprise Name" value={formData.entrepriseName} onChange={e => handleChange("entrepriseName", e.target.value)} />
            {formErrors.entrepriseName && <span className="error-message">{formErrors.entrepriseName}</span>}
          </div>

          <div className="form-group">
            <input type="text" placeholder="Location" value={formData.location} onChange={e => handleChange("location", e.target.value)} />
            {formErrors.location && <span className="error-message">{formErrors.location}</span>}
          </div>

          <div className="form-group">
            <input type="text" placeholder="Duration (e.g., 3 months)" value={formData.duration} onChange={e => handleChange("duration", e.target.value)} />
            {formErrors.duration && <span className="error-message">{formErrors.duration}</span>}
          </div>

          <div className="form-group full-width">
            <label className="form-label">Start Date</label>
            <input type="date" value={formData.startDate} onChange={e => handleChange("startDate", e.target.value)} />
            {formErrors.startDate && <span className="error-message">{formErrors.startDate}</span>}
          </div>
        </div>

        <div className="form-group">
          <textarea placeholder="Description" value={formData.description} onChange={e => handleChange("description", e.target.value)} rows="4" style={{ width: "100%" }} />
          {formErrors.description && <span className="error-message">{formErrors.description}</span>}
        </div>

        <label className="form-label">Required Skills</label>
        <select
          multiple
          value={formData.selectedSkills}
          onChange={e => handleChange("selectedSkills", [...e.target.selectedOptions].map(o => o.value))}
          style={{ width: "100%", padding: "10px", marginBottom: "1rem" }}
        >
          {skills.map((skill) => (
            <option key={skill._id} value={skill._id}>{skill.name}</option>
          ))}
        </select>
        {formErrors.selectedSkills && <span className="error-message">{formErrors.selectedSkills}</span>}

        <div className="add-experience-form">
          <h4 className="form-subheader">Tasks</h4>
          {formData.tasks.map((task, index) => (
            <div key={index} className="form-group">
              <input
                type="text"
                placeholder={`Task ${index + 1} Title`}
                value={task.title}
                onChange={e => handleTaskChange(index, "title", e.target.value)}
                style={{ marginBottom: "0.5rem" }}
              />
              <textarea
                placeholder="Task Description"
                value={task.description}
                onChange={e => handleTaskChange(index, "description", e.target.value)}
                rows="2"
                style={{ marginBottom: "0.5rem" }}
              />
              {formErrors.tasks && formErrors.tasks[index] && <span className="error-message">{formErrors.tasks[index]}</span>}
              {index > 0 && (
                <button type="button" className="btn-danger" onClick={() => removeTask(index)}><Trash size={16} /></button>
              )}
            </div>
          ))}

          <button type="button" className="button button-secondary" onClick={addTask}>
            <Plus size={16} /> Add Task
          </button>
        </div>

        <div className="navigation-container">
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? "Saving..." : "Update Internship"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default EditInternshipPage;