import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Clock, Users, BookOpen, Award, MessageCircle, ArrowLeft, Heart, Share2, ThumbsUp, Reply, Moon, Sun, ChevronUp, Trophy, CheckCircle, Circle } from "lucide-react";
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
  const [progress, setProgress] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [likedReviews, setLikedReviews] = useState({});
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [discussionText, setDiscussionText] = useState("");
  const [discussions, setDiscussions] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [badges, setBadges] = useState([]);
  const API_BASE_URL = "http://localhost:5000";
  const token = localStorage.getItem("jwtToken");
  const topRef = useRef(null);

  // ObjectID validation (24 hexadecimal characters)
  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  // Load initial data
  useEffect(() => {
    const fetchSkillDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}`);
        const data = await response.json();
        if (response.ok) {
          setSkill(data.data);
          if (token) {
            const responseBookmarks = await fetch(`${API_BASE_URL}/api/skills/bookmark`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (responseBookmarks.ok) {
              const bookmarksData = await responseBookmarks.json();
              setIsBookmarked(bookmarksData.bookmarks?.includes(skillId) || false);
            }
          }
        } else {
          setError(data.message || "Failed to load skill details");
        }
      } catch (err) {
        setError("An error occurred while loading details");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProgress = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/skills/progress/${skillId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setProgress(data.progress || []);
          setBadges(data.badges || []);
        }
      } catch (err) {
        console.error("Error loading progress:", err);
        toast.error("Failed to load progress.");
      }
    };

    const fetchDiscussions = async () => {
      if (!isValidObjectId(skillId)) {
        setDiscussions([]);
        toast.error("Invalid skill ID format");
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/skills/discussions/${skillId}`);
        const data = await response.json();
        if (response.ok) {
          setDiscussions(data.discussions || []);
        } else {
          setDiscussions([]);
          toast.error("Failed to load discussions");
        }
      } catch (err) {
        setDiscussions([]);
        toast.error("Error loading discussions.");
      }
    };

    if (skillId) {
      fetchSkillDetails();
      fetchUserProgress();
      fetchDiscussions();
    }
  }, [skillId, token]);

  // Handle scrolling for the "Back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add or remove bookmark
  const toggleBookmark = async () => {
    if (!skillId || !isValidObjectId(skillId)) {
      toast.error("Invalid skill ID");
      return;
    }
    const method = isBookmarked ? "DELETE" : "POST";
    const response = await fetch(`${API_BASE_URL}/api/skills/bookmark`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ skillId }),
    });
    if (response.ok) {
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    } else {
      toast.error("Failed to update bookmarks");
    }
  };

  // Share the skill
  const shareSkill = () => {
    const shareData = {
      title: skill.name,
      text: `Discover this skill on Skill Exchange: ${skill.name}`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.error("Share error:", err));
    } else {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
      window.open(shareUrl, "_blank");
    }
  };

  // Submit a review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please log in to submit a review");
      return;
    }
    if (userRating < 1 || userRating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: userRating, comment: reviewText }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Review submitted successfully!");
        setSkill(data.data);
        setReviewText("");
        setUserRating(0);
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (err) {
      toast.error("Error submitting review");
    }
  };

  // Reply to a review
  const handleSubmitReply = async (reviewId) => {
    if (!token) {
      toast.error("Please log in to reply");
      return;
    }
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: replyText }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Reply submitted successfully!");
        setSkill(data.data);
        setReplyText("");
        setReplyTo(null);
      } else {
        toast.error(data.message || "Failed to submit reply");
      }
    } catch (err) {
      toast.error("Error submitting reply");
    }
  };

  // Like a review (client-side only)
  const toggleLikeReview = (reviewId) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // Submit a discussion
  const handleSubmitDiscussion = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please log in to post a discussion");
      return;
    }
    if (!discussionText.trim()) {
      toast.error("Discussion content cannot be empty");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}/discussions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: discussionText }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Discussion posted successfully!");
        setDiscussions([...discussions, data.discussion]);
        setDiscussionText("");
      } else {
        toast.error(data.message || "Failed to post discussion");
      }
    } catch (err) {
      toast.error("Error posting discussion");
    }
  };

  // Mark a step as completed
  const markStepCompleted = async (stepIndex) => {
    if (!token) {
      toast.error("Please log in to update progress");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/skills/progress/${skillId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stepIndex, completed: true }),
      });
      const data = await response.json();
      if (response.ok) {
        const updatedProgress = [...progress];
        updatedProgress[stepIndex].completed = true;
        setProgress(updatedProgress);
        toast.success("Step marked as completed!");
        if (updatedProgress.every((step) => step.completed)) {
          const newBadge = { name: "Mastery Achieved", icon: "🏆" };
          setBadges([...badges, newBadge]);
          toast.success("🎉 Badge unlocked: Mastery Achieved!");
        }
      } else {
        toast.error(data.message || "Failed to update progress");
      }
    } catch (err) {
      toast.error("Error updating progress");
    }
  };

  // Navigate to roadmap
  const navigateToRoadmap = async () => {
    if (!token) {
      toast.error("Please log in to view roadmaps");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/roadmaps/by-skill/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.roadmap) {
        navigate(`/roadmap/${data.roadmap._id}`);
      } else {
        navigate(`/generate-roadmap?skillId=${skillId}`);
      }
    } catch (error) {
      toast.error("Error loading roadmap.");
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  // Display star rating
  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= rating ? "star filled" : "star"}
          aria-label={`Star ${i} of 5`}
        />
      );
    }
    return <div className="star-rating" role="img" aria-label={`Rating: ${rating} out of 5`}>{stars}</div>;
  };

  // Display rating input
  const renderRatingInput = () => {
    return (
      <div className="rating-input" role="radiogroup" aria-label="Rate this skill">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            className={star <= userRating ? "star filled interactive" : "star interactive"}
            onClick={() => setUserRating(star)}
            role="radio"
            aria-checked={star === userRating}
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && setUserRating(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) return <div className="loading-container">Loading skill details...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!skill) return <div className="error-container">Skill not found</div>;

  const progressPercentage = progress.length > 0 ? Math.round((progress.filter((s) => s.completed).length / progress.length) * 100) : 0;

  return (
    <div className={`skill-details-container ${darkMode ? "dark" : ""}`} ref={topRef}>
      <header className="skill-header">
        <Link to="/marketplaceSkills" className="back-link" aria-label="Back to skills">
          <ArrowLeft size={18} />
          <span>Back to Skills</span>
        </Link>
        <div className="skill-header-actions">
          <button onClick={toggleDarkMode} className="theme-toggle" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className={`bookmark-button ${isBookmarked ? "bookmarked" : ""}`}
            onClick={toggleBookmark}
            aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <Heart size={18} fill={isBookmarked ? "#ff4d4d" : "none"} color={isBookmarked ? "#ff4d4d" : "currentColor"} />
            <span>{isBookmarked ? "Saved" : "Save"}</span>
          </button>
          <button className="share-button" onClick={shareSkill} aria-label="Share this skill">
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </header>

      <section className="skill-hero">
        <div className="skill-image-container">
          <img
            src={skill.imageUrl ? `${API_BASE_URL}${skill.imageUrl}` : "/placeholder-skill.png"}
            alt={skill.name}
            onError={(e) => (e.target.src = "/placeholder-skill.png")}
          />
        </div>
        <div className="skill-hero-content">
          <h1 className="skill-title">{skill.name}</h1>
          <div className="skill-categories">
            {skill.categories?.map((category, index) => (
              <span key={index} className="skill-category">{category}</span>
            ))}
            <span className={`skill-level level-${skill.level?.toLowerCase()}`}>{skill.level}</span>
          </div>
          <div className="skill-stats">
            <div className="stat">
              <Star size={16} />
              <span>{skill.rating?.toFixed(1) || "0"} ({skill.ratings?.length || 0} reviews)</span>
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
          {progress.length > 0 && (
            <div className="progress-section">
              <h3>Your Learning Progress</h3>
              {progress.map((step, index) => (
                <div key={index} className="progress-step" data-tooltip={step.completed ? "Step completed" : "Mark as completed"}>
                  <div className="progress-step-content">
                    {step.completed ? <CheckCircle size={20} className="step-icon completed" /> : <Circle size={20} className="step-icon" />}
                    <span>{step.title}</span>
                  </div>
                  <button
                    onClick={() => markStepCompleted(index)}
                    disabled={step.completed}
                    className={step.completed ? "completed" : ""}
                  >
                    {step.completed ? "Completed" : "Mark as Completed"}
                  </button>
                </div>
              ))}
              <div className="progress-bar">
                <span>Total Progress: {progressPercentage}%</span>
                <div className="progress-bar-container">
                  <div className="progress-fill" style={{ width: `${progressPercentage}%` }}>
                    {progressPercentage === 100 && (
                      <span className="completion-celebration" role="alert" aria-live="polite">
                        🎉 Completed!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {badges.length > 0 && (
            <div className="badges-section">
              <h3>Your Achievements</h3>
              <div className="badges-list">
                {badges.map((badge, index) => (
                  <div key={index} className="badge">
                    <Trophy size={24} />
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="skill-description">{skill.description || "No description available."}</p>
          <div className="skill-cta">
            <button className="start-learning-btn" aria-label="Start learning this skill">
              Start Learning
            </button>
            <button className="explore-path-btn" onClick={navigateToRoadmap} aria-label="View learning roadmap">
              View Roadmap
            </button>
          </div>
        </div>
      </section>

      <section className="video-section">
        <h2>Introduction Video</h2>
        {skill.videoUrl ? (
          <video controls className="intro-video">
            <source src={`${API_BASE_URL}${skill.videoUrl}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p>No introduction video available.</p>
        )}
      </section>

      <nav className="skill-tabs" role="tablist">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
          role="tab"
          aria-selected={activeTab === "overview"}
          aria-controls="overview-tab"
        >
          <BookOpen size={16} />
          Overview
        </button>
        <button
          className={activeTab === "prerequisites" ? "active" : ""}
          onClick={() => setActiveTab("prerequisites")}
          role="tab"
          aria-selected={activeTab === "prerequisites"}
          aria-controls="prerequisites-tab"
        >
          <Award size={16} />
          Prerequisites
        </button>
        <button
          className={activeTab === "reviews" ? "active" : ""}
          onClick={() => setActiveTab("reviews")}
          role="tab"
          aria-selected={activeTab === "reviews"}
          aria-controls="reviews-tab"
        >
          <MessageCircle size={16} />
          Reviews ({skill.ratings?.length || 0})
        </button>
        <button
          className={activeTab === "discussion" ? "active" : ""}
          onClick={() => setActiveTab("discussion")}
          role="tab"
          aria-selected={activeTab === "discussion"}
          aria-controls="discussion-tab"
        >
          <MessageCircle size={16} />
          Discussion
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div id="overview-tab" className="overview-tab" role="tabpanel">
            <div className="content-section">
              <h2>What You'll Learn</h2>
              <ul className="learning-outcomes">
                {skill.learningOutcomes?.length > 0 ? (
                  skill.learningOutcomes.map((outcome, index) => <li key={index}>{outcome}</li>)
                ) : (
                  <li>No learning outcomes available.</li>
                )}
              </ul>
            </div>
            <div className="content-section">
              <h2>Topics Covered</h2>
              <div className="topics-grid">
                {skill.topics?.length > 0 ? (
                  skill.topics.map((topic, index) => (
                    <div key={index} className="topic-card">{topic}</div>
                  ))
                ) : (
                  <p>No topics available.</p>
                )}
              </div>
            </div>
            <div className="content-section">
              <h2>Resources</h2>
              <div className="resources-list">
                {skill.resources?.length > 0 ? (
                  skill.resources.map((resource, index) => (
                    <div key={index} className="resource-item">
                      <span className="resource-type">{resource.type}</span>
                      <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-title">
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
                {skill.relatedSkills?.length > 0 ? (
                  skill.relatedSkills.map((relSkill, index) => (
                    <Link key={index} to={`/skills/${relSkill._id}`} className="related-skill-card">
                      <h3>{relSkill.name}</h3>
                      <span className={`level level-${relSkill.level?.toLowerCase()}`}>{relSkill.level}</span>
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
          <div id="prerequisites-tab" className="prerequisites-tab" role="tabpanel">
            <div className="content-section">
              <h2>Required Knowledge</h2>
              <ul className="prerequisites-list">
                {skill.prerequisites?.length > 0 ? (
                  skill.prerequisites.map((prereq, index) => <li key={index}>{prereq}</li>)
                ) : (
                  <li>No prerequisites available.</li>
                )}
              </ul>
            </div>
            <div className="content-section">
              <h2>Recommended Preparation</h2>
              <div className="preparation-steps">
                {skill.preparationSteps?.length > 0 ? (
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
          <div id="reviews-tab" className="reviews-tab" role="tabpanel">
            <div className="reviews-summary">
              <div className="rating-average">
                <h2>{skill.rating?.toFixed(1) || "0"}</h2>
                {renderStarRating(skill.rating || 0)}
                <span>{skill.ratings?.length || 0} reviews</span>
              </div>
              <div className="rating-distribution">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = skill.ratings?.filter((r) => Math.round(r.rating) === stars).length || 0;
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
                  aria-label="Write your review"
                />
                <button type="submit" disabled={userRating === 0}>Submit Review</button>
              </form>
            </div>
            <div className="reviews-list">
              <h3>User Reviews</h3>
              {skill.ratings?.length > 0 ? (
                skill.ratings.map((review) => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <img
                          src={review.user?.profilePicture || "/placeholder-user.png"}
                          alt={`${review.user?.firstName} ${review.user?.lastName}`}
                        />
                        <span>{`${review.user?.firstName} ${review.user?.lastName}` || "Anonymous User"}</span>
                      </div>
                      {renderStarRating(review.rating)}
                      <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="review-text">{review.comment}</p>
                    <div className="review-actions">
                      <button
                        className={`like-button ${likedReviews[review._id] ? "liked" : ""}`}
                        onClick={() => toggleLikeReview(review._id)}
                        aria-label={likedReviews[review._id] ? "Unlike review" : "Like review"}
                      >
                        <ThumbsUp size={16} />
                        <span>{likedReviews[review._id] ? "Liked" : "Like"}</span>
                      </button>
                      <button onClick={() => setReplyTo(review._id)} aria-label="Reply to review">
                        <Reply size={16} />
                        <span>Reply</span>
                      </button>
                    </div>
                    {replyTo === review._id && (
                      <div className="reply-form">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          rows={2}
                          aria-label="Write your reply"
                        />
                        <button onClick={() => handleSubmitReply(review._id)}>Submit Reply</button>
                        <button onClick={() => setReplyTo(null)}>Cancel</button>
                      </div>
                    )}
                    {review.replies?.length > 0 && (
                      <div className="replies-list">
                        {review.replies.map((reply, index) => (
                          <div key={index} className="reply">
                            <span>{`${reply.user?.firstName} ${reply.user?.lastName}` || "Anonymous"} :</span>
                            <p>{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
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

        {activeTab === "discussion" && (
          <div id="discussion-tab" className="discussion-tab" role="tabpanel">
            <div className="write-discussion">
              <h3>Start a Discussion</h3>
              <form onSubmit={handleSubmitDiscussion}>
                <textarea
                  value={discussionText}
                  onChange={(e) => setDiscussionText(e.target.value)}
                  placeholder="Ask a question or share your thoughts..."
                  rows={4}
                  aria-label="Write your discussion message"
                />
                <button type="submit">Post Discussion</button>
              </form>
            </div>
            <div className="discussions-list">
              <h3>Community Discussions</h3>
              {discussions.length > 0 ? (
                discussions.map((discussion) => (
                  <div key={discussion._id} className="discussion-card">
                    <div className="discussion-header">
                      <div className="discussion-user">
                        <img
                          src={discussion.user?.profilePicture || "/placeholder-user.png"}
                          alt={`${discussion.user?.firstName} ${discussion.user?.lastName}`}
                        />
                        <span>{`${discussion.user?.firstName} ${discussion.user?.lastName}` || "Anonymous User"}</span>
                      </div>
                      <span className="discussion-date">{new Date(discussion.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="discussion-text">{discussion.content}</p>
                  </div>
                ))
              ) : (
                <p>No discussions yet. Start one now!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
};

export default SkillDetails;