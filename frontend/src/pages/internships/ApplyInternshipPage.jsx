import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Calendar, MapPin, Clock, ListChecks } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import "../profile/PersonalInfoPage.css";
import "./StudentInternshipListPage.css";

const ApplyInternshipPage = () => {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/internships/${id}`);
        setInternship(res.data);
      } catch (err) {
        toast.error("Failed to load internship details.");
      }
    };
    fetchInternship();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};

    if (!cvFile) {
      newErrors.cvFile = "Please upload your CV.";
    } else if (!["application/pdf"].includes(cvFile.type)) {
      newErrors.cvFile = "Only PDF files are allowed.";
    }

    if (!coverLetter.trim()) {
      newErrors.coverLetter = "Cover letter is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("internshipOfferId", id);
    formData.append("coverLetter", coverLetter);
    formData.append("cv", cvFile);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/internships/apply", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Application submitted successfully.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setCoverLetter("");
      setCvFile(null);
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply.");
    } finally {
      setLoading(false);
    }
  };

  if (!internship) return <p>Loading...</p>;

  return (
    <section className="personal-info-section" style={{ maxWidth: "1200px", margin: "0 auto" }}>
       <div style={{ marginBottom: "1rem" }}>
        <button
          className="button button-secondary"
          onClick={() => navigate("/internships")}
          style={{ padding: "8px 16px", borderRadius: "6px" }}
        >
          ← Back to Internships
        </button>
      </div>
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* Internship Details */}
        <div style={{ flex: 1 }}>
          <h3 className="section-title">Internship Details</h3>
          <div className="experience-card enhanced-card">
            <h4 className="experience-title">{internship.title}</h4>
            <p className="experience-company">Entreprise: {internship.entrepriseName}</p>
            <div className="info-row spaced">
              <span className="meta-info">
                <Calendar size={16} className="icon-inline" />{" "}
                {new Date(internship.startDate).toLocaleDateString()}
              </span>
              <span className="meta-info">
                <MapPin size={16} className="icon-inline" /> {internship.location || "N/A"}
              </span>
              <span className="meta-info">
                <Clock size={16} className="icon-inline" /> {internship.duration || "N/A"}
              </span>
            </div>
            <p className="experience-description" style={{ marginTop: "1rem" }}>{internship.description}</p>
            <div className="tag-container" style={{ marginTop: "1rem" }}>
              {internship.skills.map((skill) => (
                <span key={skill._id} className="skill-tag enhanced-tag">
                  {skill.name}
                </span>
              ))}
            </div>

            {internship.tasks?.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#00BFCB" }}>
                  <ListChecks size={18} /> Internship Tasks
                </h4>
                <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
                  {internship.tasks.map((task, index) => (
                    <li key={index} style={{ marginBottom: "0.75rem" }}>
                      <strong>{task.title}</strong>
                      {task.description && <p style={{ marginTop: "0.25rem", color: "#555" }}>{task.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "#ddd", height: "100%" }} />

        {/* Apply Form */}
        <div style={{ flex: 1 }}>
          <h3 className="section-title">Apply Now</h3>
          <form onSubmit={handleApply} className="form-group">
            <label>Upload CV (PDF/Image) <span style={{ color: "red" }}>*</span></label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
              <label
                htmlFor="cv-upload"
                className="button button-secondary"
                style={{ cursor: "pointer", padding: "0.5rem 1rem" }}
              >
                Choose File
              </label>
              <span>{cvFile ? cvFile.name : "No file selected"}</span>
            </div>
            {errors.cvFile && <span className="error-message">{errors.cvFile}</span>}
            <input
              id="cv-upload"
              type="file"
              accept="application/pdf"
              onChange={(e) => setCvFile(e.target.files[0])}
              style={{ display: "none" }}
            />

            <label style={{ marginTop: "1rem" }}>Cover Letter <span style={{ color: "red" }}>*</span></label>
            <textarea
              rows="6"
              placeholder="Write your cover letter here"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="input-field"
              style={{
                marginBottom: errors.coverLetter ? "0.25rem" : "1rem",
                borderColor: errors.coverLetter ? "red" : "#ccc",
              }}
            />
            {errors.coverLetter && <span className="error-message">{errors.coverLetter}</span>}

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
              style={{ marginTop: "1rem" }}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ApplyInternshipPage;
