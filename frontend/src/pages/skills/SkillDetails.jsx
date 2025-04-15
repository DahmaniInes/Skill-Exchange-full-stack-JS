import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Clock, Users, BookOpen, Award, MessageCircle, ArrowLeft, Heart, Share2 } from "lucide-react";
import { toast } from "react-toastify";
import "./SkillDetailsStyles.css";

const SkillDetails = () => {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [userRating, setUserRating] = useState(0);
  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchSkillDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}`);
        const data = await response.json();

        if (response.ok) {
          setSkill(data.data); // Assuming API returns { success: true, data: skill }
          const savedBookmarks = JSON.parse(localStorage.getItem("bookmarkedSkills") || "[]");
          setIsBookmarked(savedBookmarks.includes(skillId));
        } else {
          setError(data.message || "Failed to load skill details");
        }
      } catch (err) {
        setError("An error occurred while fetching skill details");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      fetchSkillDetails();
    }
  }, [skillId]);

  const toggleBookmark = () => {
    const savedBookmarks = JSON.parse(localStorage.getItem("bookmarkedSkills") || "[]");
    let newBookmarks;

    if (isBookmarked) {
      newBookmarks = savedBookmarks.filter((id) => id !== skillId);
    } else {
      newBookmarks = [...savedBookmarks, skillId];
    }

    localStorage.setItem("bookmarkedSkills", JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    alert(`Thank you for your ${userRating}-star review!`);
    setReviewText("");
    setUserRating(0);
  };

  const navigateToRoadmap = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        toast.error("Please log in to view roadmaps");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/roadmaps/by-skill/${skillId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.roadmap) {
        navigate(`/roadmap/${data.roadmap._id}`);
      } else {
        navigate(`/generate-roadmap?skillId=${skillId}`);
      }
    } catch (error) {
      console.error("Error checking roadmap:", error);
      toast.error("Error loading roadmap. Please try again.");
    }
  };

  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= rating ? "star filled" : "star"}
        />
      );
    }
    return <div className="star-rating">{stars}</div>;
  };

  const renderRatingInput = () => {
    return (
      <div className="rating-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            className={star <= userRating ? "star filled interactive" : "star interactive"}
            onClick={() => setUserRating(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) return <div className="loading-container">Loading skill details...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!skill) return <div className="error-container">Skill not found</div>;

  return (
    <div className="skill-details-container">
      <header className="skill-header">
        <Link to="/marketplaceSkills" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Skills</span>
        </Link>
        <div className="skill-header-actions">
          <button
            className={`bookmark-button ${isBookmarked ? "bookmarked" : ""}`}
            onClick={toggleBookmark}
          >
            <Heart
              size={18}
              fill={isBookmarked ? "#ff4d4d" : "none"}
              color={isBookmarked ? "#ff4d4d" : "currentColor"}
            />
            <span>{isBookmarked ? "Saved" : "Save"}</span>
          </button>
          <button className="share-button">
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </header>

      <section className="skill-hero">
        <div className="skill-image-container">
          <img
            src={skill.imageUrl ? `${API_BASE_URL}${skill.imageUrl}` : "/placeholder-skill.png"}
            alt={skill.name || "Skill"}
            onError={(e) => {
              console.log("Image failed to load:", e.target.src);
              e.target.src = "/placeholder-skill.png";
            }}
          />
        </div>
        <div className="skill-hero-content">
          <h1 className="skill-title">{skill.name || "Unnamed Skill"}</h1>

          <div className="skill-categories">
            {Array.isArray(skill.categories) &&
              skill.categories.map((category, index) => (
                <span key={index} className="skill-category">
                  {category}
                </span>
              ))}
            <span
              className={`skill-level level-${
                typeof skill.level === "string" ? skill.level.toLowerCase() : "intermediate"
              }`}
            >
              {skill.level || "Intermediate"}
            </span>
          </div>

          <div className="skill-stats">
            <div className="stat">
              <Star size={16} />
              <span>
                {skill.rating ? skill.rating.toFixed(1) : "4.5"} (
                {skill.ratings?.length || 0} reviews)
              </span>
            </div>
            <div className="stat">
              <Users size={16} />
              <span>{skill.popularity || 0} learners</span>
            </div>
            <div className="stat">
              <Clock size={16} />
              <span>Est. {skill.estimatedTimeHours || 10} hours to master</span>
            </div>
          </div>

          <p className="skill-description">{skill.description || "No description available."}</p>

          <div className="skill-cta">
            <button className="start-learning-btn">Start Learning</button>
            <button className="explore-path-btn" onClick={navigateToRoadmap}>
              View Roadmap
            </button>
          </div>
        </div>
      </section>

      <nav className="skill-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          <BookOpen size={16} />
          Overview
        </button>
        <button
          className={activeTab === "prerequisites" ? "active" : ""}
          onClick={() => setActiveTab("prerequisites")}
        >
          <Award size={16} />
          Prerequisites
        </button>
        <button
          className={activeTab === "reviews" ? "active" : ""}
          onClick={() => setActiveTab("reviews")}
        >
          <MessageCircle size={16} />
          Reviews ({skill.ratings?.length || 0})
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="content-section">
              <h2>What you'll learn</h2>
              <ul className="learning-outcomes">
                {Array.isArray(skill.learningOutcomes) && skill.learningOutcomes.length > 0 ? (
                  skill.learningOutcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))
                ) : (
                  <li>No learning outcomes available.</li>
                )}
              </ul>
            </div>

            <div className="content-section">
              <h2>Topics Covered</h2>
              <div className="topics-grid">
                {Array.isArray(skill.topics) && skill.topics.length > 0 ? (
                  skill.topics.map((topic, index) => (
                    <div key={index} className="topic-card">
                      <span>{topic}</span>
                    </div>
                  ))
                ) : (
                  <p>No topics available.</p>
                )}
              </div>
            </div>

            <div className="content-section">
              <h2>Resources</h2>
              <div className="resources-list">
                {Array.isArray(skill.resources) && skill.resources.length > 0 ? (
                  skill.resources.map((resource, index) => (
                    <div key={index} className="resource-item">
                      <span className="resource-type">{resource.type}</span>
                      <a href={resource.link} className="resource-title">
                        {resource.title}
                      </a>
                    </div>
                  ))
                ) : (
                  <p>No resources available.</p>
                )}
              </div>
            </div>

            <div className="content-section">
              <h2>Related Skills</h2>
              <div className="related-skills">
                {Array.isArray(skill.relatedSkills) && skill.relatedSkills.length > 0 ? (
                  skill.relatedSkills.map((relSkill) => (
                    <Link
                      key={relSkill.id}
                      to={`/skills/${relSkill.id}`}
                      className="related-skill-card"
                    >
                      <h3>{relSkill.name}</h3>
                      <span className={`level level-${relSkill.level.toLowerCase()}`}>
                        {relSkill.level}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p>No related skills available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "prerequisites" && (
          <div className="prerequisites-tab">
            <div className="content-section">
              <h2>Required Knowledge</h2>
              <ul className="prerequisites-list">
                {Array.isArray(skill.prerequisites) && skill.prerequisites.length > 0 ? (
                  skill.prerequisites.map((prereq, index) => (
                    <li key={index}>{prereq}</li>
                  ))
                ) : (
                  <li>No prerequisites available.</li>
                )}
              </ul>
            </div>

            <div className="content-section">
              <h2>Recommended Preparation</h2>
              <div className="preparation-steps">
                {Array.isArray(skill.preparationSteps) && skill.preparationSteps.length > 0 ? (
                  skill.preparationSteps.map((step, index) => (
                    <div key={index} className="preparation-step">
                      <span className="step-number">{index + 1}</span>
                      <div className="step-content">
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No preparation steps available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="reviews-tab">
            <div className="reviews-summary">
              <div className="rating-average">
                <h2>{skill.rating ? skill.rating.toFixed(1) : "4.5"}</h2>
                {renderStarRating(skill.rating || 4.5)}
                <span>{skill.ratings?.length || 0} reviews</span>
              </div>

              <div className="rating-distribution">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count =
                    skill.ratings?.filter((r) => Math.round(r.value) === stars).length || 0;
                  const percentage = skill.ratings?.length
                    ? (count / skill.ratings.length) * 100
                    : 0;

                  return (
                    <div key={stars} className="rating-bar">
                      <span>{stars} stars</span>
                      <div className="bar-container">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="write-review">
              <h3>Write a Review</h3>
              <form onSubmit={handleSubmitReview}>
                {renderRatingInput()}
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this skill..."
                  rows={4}
                />
                <button type="submit" disabled={userRating === 0}>
                  Submit Review
                </button>
              </form>
            </div>

            <div className="reviews-list">
              <h3>User Reviews</h3>
              {Array.isArray(skill.ratings) && skill.ratings.length > 0 ? (
                skill.ratings.map((review) => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <img
                          src={review.user?.avatar || "/placeholder-user.png"}
                          alt="User"
                        />
                        <span>{review.user?.name || "Anonymous User"}</span>
                      </div>
                      {renderStarRating(review.value)}
                      <span className="review-date">
                        {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="review-text">{review.comment || "No comment provided."}</p>
                  </div>
                ))
              ) : (
                <div className="no-reviews">
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillDetails;