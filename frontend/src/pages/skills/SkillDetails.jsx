import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Clock, Users, BookOpen, Award, MessageCircle, ArrowLeft, Heart, Share2 } from "lucide-react";
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
          setSkill(data);
          // Check if user has bookmarked this skill (would be from auth context in real app)
          const savedBookmarks = JSON.parse(localStorage.getItem("bookmarkedSkills") || "[]");
          setIsBookmarked(savedBookmarks.includes(skillId));
        } else {
          setError(data.message || "Failed to load skill details");
        }
      } catch (err) {
        setError("An error occurred while fetching skill details");
        console.error(err);
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
      newBookmarks = savedBookmarks.filter(id => id !== skillId);
    } else {
      newBookmarks = [...savedBookmarks, skillId];
    }
    
    localStorage.setItem("bookmarkedSkills", JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    // In a real application, this would send the review to the API
    alert(`Thank you for your ${userRating}-star review!`);
    setReviewText("");
    setUserRating(0);
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
  // In SkillDetails.jsx, modify the navigateToRoadmap function:

const navigateToRoadmap = async () => {
    try {
      // First, check if a roadmap exists for this skill
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        // Handle unauthenticated user
        toast.error("Please log in to view roadmaps");
        return;
      }
  
      // Option 1: Check if roadmap exists for this skill
      const response = await fetch(`${API_BASE_URL}/api/roadmaps/by-skill/${skillId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      const data = await response.json();
      
      if (response.ok && data.roadmap) {
        // Roadmap exists, navigate to it
        navigate(`/roadmap/${data.roadmap._id}`);
      } else {
        // Option 2: Generate new roadmap based on skill
        navigate(`/generate-roadmap?skillId=${skillId}`);
        // OR show a modal asking if they want to create one
        // setShowCreateRoadmapModal(true);
      }
    } catch (error) {
      console.error("Error checking roadmap:", error);
      toast.error("Error loading roadmap. Please try again.");
    }
  };

  const renderRatingInput = () => {
    return (
      <div className="rating-input">
        {[1, 2, 3, 4, 5].map(star => (
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
      {/* Header with navigation and actions */}
      <header className="skill-header">
        <Link to="/marketplaceSkills" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Skills</span>
        </Link>
        <div className="skill-header-actions">
          <button 
            className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={toggleBookmark}
          >
            <Heart size={18} fill={isBookmarked ? "#ff4d4d" : "none"} color={isBookmarked ? "#ff4d4d" : "currentColor"} />
            <span>{isBookmarked ? "Saved" : "Save"}</span>
          </button>
          <button className="share-button">
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Hero section */}
      <section className="skill-hero">
        <div className="skill-image-container">
          <img 
            src={skill.imageUrl || "/placeholder-skill.png"} 
            alt={skill.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-skill.png";
            }}
          />
        </div>
        <div className="skill-hero-content">
          <h1 className="skill-title">{skill.name}</h1>
          
          <div className="skill-categories">
            {skill.categories && skill.categories.map((category, index) => (
              <span key={index} className="skill-category">{category}</span>
            ))}
            <span className={`skill-level level-${skill.level ? skill.level.toLowerCase() : 'intermediate'}`}>
              {skill.level || 'Intermediate'}
            </span>
          </div>
          
          <div className="skill-stats">
            <div className="stat">
              <Star size={16} />
              <span>{skill.rating ? skill.rating.toFixed(1) : '4.5'} ({skill.ratings?.length || 0} reviews)</span>
            </div>
            <div className="stat">
              <Users size={16} />
              <span>{skill.popularity || 250} learners</span>
            </div>
            <div className="stat">
              <Clock size={16} />
              <span>Est. {skill.estimatedTimeHours || 10} hours to master</span>
            </div>
          </div>
          
          <p className="skill-description">{skill.description || 'No description available.'}</p>
          
          <div className="skill-cta">
            <button className="start-learning-btn">Start Learning</button>
            {/* Bouton modifié pour accéder à la page de roadmap */}
            <button className="explore-path-btn" onClick={navigateToRoadmap}>View Roadmap</button>
          </div>
        </div>
      </section>

      {/* Navigation tabs */}
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

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="content-section">
              <h2>What you'll learn</h2>
              <ul className="learning-outcomes">
                {(skill.learningOutcomes || [
                  "Understanding the core concepts",
                  "Practical application of techniques",
                  "Building real-world projects",
                  "Advanced problem-solving strategies"
                ]).map((outcome, index) => (
                  <li key={index}>{outcome}</li>
                ))}
              </ul>
            </div>
            
            <div className="content-section">
              <h2>Topics Covered</h2>
              <div className="topics-grid">
                {(skill.topics || [
                  "Introduction to basics",
                  "Intermediate concepts",
                  "Advanced techniques",
                  "Professional integration",
                  "Optimization strategies",
                  "Case studies"
                ]).map((topic, index) => (
                  <div key={index} className="topic-card">
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="content-section">
              <h2>Resources</h2>
              <div className="resources-list">
                {(skill.resources || [
                  { type: "Article", title: "Getting Started Guide", link: "#" },
                  { type: "Video", title: "Introduction Tutorial", link: "#" },
                  { type: "Book", title: "Comprehensive Manual", link: "#" }
                ]).map((resource, index) => (
                  <div key={index} className="resource-item">
                    <span className="resource-type">{resource.type}</span>
                    <a href={resource.link} className="resource-title">{resource.title}</a>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="content-section">
              <h2>Related Skills</h2>
              <div className="related-skills">
                {(skill.relatedSkills || [
                  { id: "1", name: "Related Skill 1", level: "Beginner" },
                  { id: "2", name: "Related Skill 2", level: "Intermediate" },
                  { id: "3", name: "Related Skill 3", level: "Advanced" }
                ]).map((relSkill, index) => (
                  <Link key={index} to={`/skills/${relSkill.id}`} className="related-skill-card">
                    <h3>{relSkill.name}</h3>
                    <span className={`level level-${relSkill.level.toLowerCase()}`}>
                      {relSkill.level}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "prerequisites" && (
          <div className="prerequisites-tab">
            <div className="content-section">
              <h2>Required Knowledge</h2>
              <ul className="prerequisites-list">
                {(skill.prerequisites || [
                  "Basic understanding of the field",
                  "Familiarity with fundamental concepts",
                  "Access to necessary tools"
                ]).map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            </div>
            
            <div className="content-section">
              <h2>Recommended Preparation</h2>
              <div className="preparation-steps">
                {(skill.preparationSteps || [
                  { title: "Review basics", description: "Refresh your knowledge on core concepts" },
                  { title: "Set up environment", description: "Prepare your workspace with the required tools" },
                  { title: "Complete introductory tutorial", description: "Work through the beginner's guide" }
                ]).map((step, index) => (
                  <div key={index} className="preparation-step">
                    <span className="step-number">{index + 1}</span>
                    <div className="step-content">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>  
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "reviews" && (
          <div className="reviews-tab">
            <div className="reviews-summary">
              <div className="rating-average">
                <h2>{skill.rating ? skill.rating.toFixed(1) : '4.5'}</h2>
                {renderStarRating(skill.rating || 4.5)}
                <span>{skill.ratings?.length || 0} reviews</span>
              </div>
              
              <div className="rating-distribution">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = skill.ratings?.filter(r => Math.round(r.value) === stars).length || 0;
                  const percentage = skill.ratings?.length ? (count / skill.ratings.length) * 100 : 0;
                  
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
                <button type="submit" disabled={userRating === 0}>Submit Review</button>
              </form>
            </div>
            
            <div className="reviews-list">
              <h3>User Reviews</h3>
              {(skill.ratings || []).length > 0 ? (
                skill.ratings.map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <img src={review.user?.avatar || "/placeholder-user.png"} alt="User" />
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