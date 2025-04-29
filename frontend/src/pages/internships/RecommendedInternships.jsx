import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, MapPin, Clock, Send } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StudentInternshipListPage.css";
import { useNavigate } from "react-router-dom";

const RecommendedInternships = () => {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/recommendations/recommend");
        setRecommended(res.data);
      } catch (err) {
        toast.error("Failed to load recommended internships");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, []);

  const handleApply = (internshipId) => {
    navigate(`/internships/apply/${internshipId}`);
  };

  return (
    <section className="personal-info-section"
        style={{ marginTop: "2rem", marginBottom: "2rem" }}
        >
      <h3 className="section-title">Recommended Internships for You</h3>

      {loading ? (
        <p>Loading recommendations...</p>
      ) : recommended.length === 0 ? (
        <p>No recommended internships available at the moment.</p>
      ) : (
        <div className="horizontal-scroll-container">
          {recommended.map((offer) => (
            <div key={offer._id} className="experience-card enhanced-card scroll-card">
              <div className="card-header space-between">
                <div>
                  <h4 className="experience-title"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleApply(offer._id)}
                  >{offer.title}</h4>
                  <p className="experience-company">
                    <strong>Company:</strong> {offer.entrepriseName}
                  </p>
                </div>
              </div>

              <div className="info-row spaced">
                <span className="meta-info">
                  <Calendar size={16} className="icon-inline" />{" "}
                  {new Date(offer.startDate).toLocaleDateString()}
                </span>
                <span className="meta-info">
                  <MapPin size={16} className="icon-inline" /> {offer.location || "N/A"}
                </span>
                <span className="meta-info">
                  <Clock size={16} className="icon-inline" /> {offer.duration || "N/A"}
                </span>
              </div>

              <div className="tag-container">
                {offer.skills.map((skill) => (
                  <span key={skill._id} className="skill-tag enhanced-tag">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendedInternships;
