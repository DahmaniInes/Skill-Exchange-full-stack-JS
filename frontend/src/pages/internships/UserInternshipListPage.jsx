import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Calendar, MapPin, Clock, Building2, AlignLeft, Trash2, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../profile/PersonalInfoPage.css";

const UserInternshipListPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/internships/my-offers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOffers(res.data);
      } catch (err) {
        toast.error("Failed to fetch internship offers.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this internship offer?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/internships/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Internship offer deleted.");
      setOffers((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      toast.error("Failed to delete internship offer.");
    }
  };

  const tagColors = ["#E0F7FA", "#FFF3E0", "#E8F5E9", "#FCE4EC", "#EDE7F6"];
  const tagTextColors = ["#00796B", "#E65100", "#2E7D32", "#AD1457", "#5E35B1"];

  return (
    <section className="personal-info-section">
      <h3 className="section-title">My Internship Offers</h3>

      <div style={{ marginBottom: "1rem", marginTop: "0.5rem" }}>
        <button
          className="button button-primary"
          onClick={() => navigate("/internship-create")}
          style={{ padding: "8px 16px", borderRadius: "6px" }}
        >
          <Plus size={16} className="icon-inline" /> Create New Internship Offer
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : offers.length === 0 ? (
        <p>No internship offers found.</p>
      ) : (
        <div className="experience-list">
          {offers.map((offer) => (
            <div key={offer._id} className="experience-card refined-card">
              <div className="card-header refined-header">
                <div className="header-left">
                  <h4 className="experience-title">{offer.title}</h4>
                  <p className="experience-company">
                    <Building2 size={16} className="icon-inline" /> {offer.entrepriseName}
                  </p>
                </div>
                <div className="header-right">
                  <div className="info-row" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span className="meta-info">
                      <Calendar size={16} className="icon-inline" /> {new Date(offer.startDate).toLocaleDateString()}
                    </span>
                    <span className="meta-info">
                      <MapPin size={16} className="icon-inline" /> {offer.location || "N/A"}
                    </span>
                    <span className="meta-info">
                      <Clock size={16} className="icon-inline" /> {offer.duration || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="experience-description" title={offer.description}>
                <AlignLeft size={16} className="icon-inline" /> {offer.description.length > 160 ? `${offer.description.substring(0, 160)}...` : offer.description}
              </p>

              <div className="experience-description">
                <strong>Tasks:</strong>
                <ul className="task-list">
                  {offer.tasks?.map((task, idx) => (
                    <li key={idx} title={task.description}>
                      ✅ <strong>{task.title}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-group">
                <strong>Required Skills:</strong>
                <div className="tag-container">
                  {offer.skills?.map((skill, index) => (
                    <span
                      key={skill._id}
                      className="tag refined-tag"
                      style={{ backgroundColor: tagColors[index % tagColors.length], color: tagTextColors[index % tagTextColors.length], padding: "6px 12px", borderRadius: "999px", marginRight: "0.5rem", marginBottom: "0.5rem", display: "inline-block", fontWeight: 500 }}
                      title={`Category: ${skill.categories.join(", ")}`}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="action-row-bottom" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  className="button button-secondary"
                  style={{ padding: "0.5rem 1.2rem", borderRadius: "6px", display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid #ccc", backgroundColor: "#f8fafc" }}
                  onClick={() => navigate(`/edit-internship/${offer._id}`)}
                  title="Edit"
                >
                  <Pencil size={16} className="icon-inline" /> Edit
                </button>
                <button
                  className="button button-danger"
                  style={{ backgroundColor: "#ef4444", color: "white", padding: "0.5rem 1.2rem", borderRadius: "6px", display: "flex", alignItems: "center", gap: "0.5rem", border: "none" }}
                  onClick={() => handleDelete(offer._id)}
                  title="Delete"
                >
                  <Trash2 size={16} className="icon-inline" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UserInternshipListPage;
