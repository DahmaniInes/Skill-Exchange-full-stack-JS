import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, MapPin, Clock, Send } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../profile/PersonalInfoPage.css";
import "./StudentInternshipListPage.css";
import { useNavigate } from "react-router-dom";
import { TextField, Select, MenuItem, FormControl, InputLabel, Box } from "@mui/material";

const StudentInternshipListPage = () => {
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortOption, setSortOption] = useState("");

  const navigate = useNavigate();

  

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/internships");
        setInternships(res.data);
        setFilteredInternships(res.data);
      } catch (err) {
        toast.error("Failed to load internships");
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, []);

  useEffect(() => {
    let filtered = [...internships];
    if (searchTerm.trim()) {
      filtered = filtered.filter((offer) =>
        offer.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (locationFilter) {
      filtered = filtered.filter((offer) =>
        offer.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    if (sortOption === "startDate") {
      filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } else if (sortOption === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    setFilteredInternships(filtered);
  }, [searchTerm, locationFilter, sortOption, internships]);

  const handleApply = (internshipId) => {
    navigate(`/internships/apply/${internshipId}`);
  };

  return (
    <section className="personal-info-section">
      <h3 className="section-title">Available Internships</h3>

      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Search by Title"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <TextField
          label="Filter by Location"
          variant="outlined"
          size="small"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
        <FormControl size="small">
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortOption}
            label="Sort By"
            onChange={(e) => setSortOption(e.target.value)}
            style={{ minWidth: "150px" }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="startDate">Start Date</MenuItem>
            <MenuItem value="title">Title</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <p>Loading...</p>
      ) : filteredInternships.length === 0 ? (
        <p>No internships available.</p>
      ) : (
        filteredInternships.map((offer) => (
          <div key={offer._id} className="experience-card enhanced-card">
            <div className="card-header space-between">
              <div>
                <h4 className="experience-title">{offer.title}</h4>
                <p className="experience-company">
                  <strong>Entreprise:</strong> {offer.entrepriseName}
                </p>
              </div>
              <button
                className="button button-primary apply-btn"
                onClick={() => handleApply(offer._id)}
              >
                <Send size={16} className="icon-inline" /> Apply
              </button>
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

            <p className="experience-description">{offer.description}</p>

            <div className="tag-container">
              {offer.skills.map((skill) => (
                <span key={skill._id} className="skill-tag enhanced-tag">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
};

export default StudentInternshipListPage;
