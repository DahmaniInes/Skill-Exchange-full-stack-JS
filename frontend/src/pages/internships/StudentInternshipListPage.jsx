import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, MapPin, Clock, Send } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../profile/PersonalInfoPage.css";
import "./StudentInternshipListPage.css";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from "@mui/material";
import RecommendedInternships from "./RecommendedInternships";

const StudentInternshipListPage = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(false);

  // Draft inputs (before user clicks "Apply Filters")
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [sortInput, setSortInput] = useState("");

  // Actual filters used in API request
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortOption, setSortOption] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(6);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: limit,
          search: searchTerm,
          location: locationFilter,
          sort: sortOption,
        }).toString();

        const res = await axios.get(
          `http://localhost:5000/api/internships?${queryParams}`
        );
        setInternships(res.data.data);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        toast.error("Failed to load internships");
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [currentPage, limit, searchTerm, locationFilter, sortOption]);

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
  }, [searchTerm, locationFilter, sortOption, internships]);

  const handleApply = (internshipId) => {
    navigate(`/internships/apply/${internshipId}`);
  };

  return (
    <>
      <RecommendedInternships />
      <section className="personal-info-section">
        <h3 className="section-title">Available Internships</h3>

        <Box display="flex" gap={2} mb={3} alignItems="center">
          <TextField
            label="Search by Title"
            variant="outlined"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <TextField
            label="Filter by Location"
            variant="outlined"
            size="small"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
          />
          <FormControl size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortInput}
              label="Sort By"
              onChange={(e) => setSortInput(e.target.value)}
              style={{ minWidth: "150px" }}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="startDate">Start Date</MenuItem>
              <MenuItem value="title">Title</MenuItem>
            </Select>
          </FormControl>

          <button
            className="btn btn-primary"
            onClick={() => {
              setSearchTerm(searchInput);
              setLocationFilter(locationInput);
              setSortOption(sortInput);
              setCurrentPage(1);
            }}
          >
            Apply Filters
          </button>
        </Box>

        {loading ? (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "4rem", height: "4rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : internships.length === 0 ? (
          <p>No internships available.</p>
        ) : (
          internships.map((offer) => (
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
                  <MapPin size={16} className="icon-inline" />{" "}
                  {offer.location || "N/A"}
                </span>
                <span className="meta-info">
                  <Clock size={16} className="icon-inline" />{" "}
                  {offer.duration || "N/A"}
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
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "between",
              alignItems: "center",
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-outline-primary me-2"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="btn btn-outline-primary ms-2"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default StudentInternshipListPage;
