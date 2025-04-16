import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./Marketplace.css";

const Marketplace = () => {
  const [popularSkills, setPopularSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [complementarySkills, setComplementarySkills] = useState([]);
  const [loadingComplementary, setLoadingComplementary] = useState(false);
  const [recentSkills, setRecentSkills] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  const [stats, setStats] = useState({ users: 0, exchanges: 0, sessions: 0, totalSkills: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyVisible, setStoryVisible] = useState(false);
  const [newStory, setNewStory] = useState({
    title: "",
    content: "",
    skillId: "",
    media: null, // Changé de 'image' à 'media'
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const storyTimeout = useRef(null);

  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    fetchPopularSkills();
    fetchRecentSkills();
    fetchStats();
    fetchAvailableSkills();
    loadStories();

    const token = localStorage.getItem("jwtToken");
    if (token) {
      fetchUserSkills();
    }

    return () => {
      if (storyTimeout.current) clearTimeout(storyTimeout.current);
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  // Nettoyage des URLs Blob lors du changement de l'aperçu
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchUserSkills = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(`${API_BASE_URL}/api/user/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setUserSkills(data.skills || []);
      if (data.skills && data.skills.length > 0) {
        fetchComplementarySkills(data.skills);
      }
    } catch (error) {
      console.error("Error fetching user skills:", error);
    }
  };

  const fetchPopularSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills?sort=popular`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setPopularSkills(data.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching popular skills:", error);
    }
  };

  const fetchRecentSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills?sort=recent`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setRecentSkills(data.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent skills:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setAvailableSkills(data.data);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const loadStories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setSuccessStories([]);
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.status === 401) {
        localStorage.removeItem("jwtToken");
        setSuccessStories([]);
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSuccessStories(data.data);
        setError(null);
      } else {
        setSuccessStories([]);
        setError("Unexpected data format.");
      }
    } catch (error) {
      setError("Failed to load stories.");
      setSuccessStories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplementarySkills = async (skillsToUse = userSkills) => {
    try {
      setLoadingComplementary(true);
      if (!skillsToUse || skillsToUse.length === 0) {
        setComplementarySkills([]);
        return;
      }
      const skillsParam = Array.isArray(skillsToUse) ? skillsToUse.join(",") : skillsToUse;
      const res = await fetch(`${API_BASE_URL}/api/skills/complementary?skills=${skillsParam}`);
      if (res.ok) {
        const data = await res.json();
        setComplementarySkills(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching complementary skills:", error);
    } finally {
      setLoadingComplementary(false);
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Please log in to share a story.");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", newStory.title);
      formData.append("content", newStory.content);
      formData.append("skillId", newStory.skillId);
      if (newStory.media) formData.append("media", newStory.media); // Changé de 'image' à 'media'
      const userId = localStorage.getItem("userId");
      if (userId) formData.append("userId", userId);

      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Creation error.");
      await response.json();
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setStoryModalOpen(false);
      setNewStory({ title: "", content: "", skillId: "", media: null });
      setImagePreview(null);
      loadStories();
      alert("Story published successfully!");
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (mediaUrl) => {
    // Renommé de getImageUrl à getMediaUrl
    if (!mediaUrl) return "/placeholder-media.png";
    return mediaUrl.startsWith("http") ? mediaUrl : `${API_BASE_URL}${mediaUrl}`;
  };

  const openStory = (index) => {
    setCurrentStoryIndex(index);
    setStoryVisible(true);
    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    storyTimeout.current = setTimeout(() => navigateStory("next"), 10000);
  };

  const navigateStory = (direction) => {
    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    if (direction === "next") {
      const nextIndex = currentStoryIndex < successStories.length - 1 ? currentStoryIndex + 1 : 0;
      if (nextIndex === 0 && currentStoryIndex === successStories.length - 1) {
        setStoryVisible(false);
      } else {
        setCurrentStoryIndex(nextIndex);
        storyTimeout.current = setTimeout(() => navigateStory("next"), 10000);
      }
    } else {
      setCurrentStoryIndex((prev) => (prev > 0 ? prev - 1 : successStories.length - 1));
      storyTimeout.current = setTimeout(() => navigateStory("next"), 10000);
    }
  };

  const closeStoryViewer = () => {
    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    setStoryVisible(false);
  };

  const handleStoryInputChange = (e) => {
    const { name, value } = e.target;
    setNewStory((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview); // Révoquer l'ancienne URL Blob
      }
      setNewStory((prev) => ({ ...prev, media: file })); // Changé de 'image' à 'media'
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const renderStoriesContent = () => {
    if (loading) {
      return [...Array(5)].map((_, i) => <div key={i} className="story-circle shimmer"></div>);
    }
    if (error) {
      return (
        <div className="error-message">
          {error}
          {error.includes("session expired") && (
            <button onClick={() => (window.location.href = "/login")} className="login-btn">
              Log in again
            </button>
          )}
        </div>
      );
    }
    if (successStories.length > 0) {
      return successStories.map((story, index) => (
        <div
          key={story._id || index}
          className="story-circle animate-pop-in"
          style={{ animationDelay: `${index * 0.1}s` }}
          onClick={() => openStory(index)}
        >
          <div className="story-circle-border">
            <img
              src={getMediaUrl(story.userImage)} // Changé de getImageUrl à getMediaUrl
              alt={story.userName}
              className="story-user-image"
              onError={(e) => (e.target.src = "/placeholder-user.png")}
            />
          </div>
          <span className="story-username">{story.userName?.split(" ")[0] || "User"}</span>
        </div>
      ));
    }
    return (
      <div className="no-stories-message">
        {localStorage.getItem("jwtToken")
          ? "No stories available. Share yours!"
          : "Log in to see stories."}
      </div>
    );
  };

  return (
    <div className="marketplace-container">
      <header className="header">
        <h1 className="title animate-pop-in">Welcome to the Skill Marketplace</h1>
        <p className="subtitle animate-pop-in delay-1">
          Discover and exchange skills with experts from around the world.
        </p>
        <p className="total-skills animate-pop-in delay-2">
          📚 Available skills: {stats.totalSkills}
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="buttons-container">
        <Link to="/marketplaceSkills" className="btn explore hover-glow">
          <span className="btn-icon">🔍</span> Search for skills
        </Link>
        <button onClick={() => setModalOpen(true)} className="btn add hover-glow">
          <span className="btn-icon">➕</span> Offer a skill
        </button>
      </div>

      <section className="success-stories-section">
        <div className="stories-header">
          <h2 className="section-title animate-slide-left">✨ Success Stories</h2>
          <button
            className="add-story-btn"
            onClick={() => {
              const token = localStorage.getItem("jwtToken");
              if (!token) {
                alert("Please log in to share a story.");
                return;
              }
              setStoryModalOpen(true);
            }}
          >
            + Add your story
          </button>
        </div>
        <div className="stories-container">
          <div
            className="story-circle add-story animate-pop-in"
            onClick={() => {
              const token = localStorage.getItem("jwtToken");
              if (!token) {
                alert("Please log in to share a story.");
                return;
              }
              setStoryModalOpen(true);
            }}
          >
            <div className="story-circle-border add">
              <div className="add-icon">+</div>
            </div>
            <span className="story-username">Add</span>
          </div>
          {renderStoriesContent()}
        </div>
      </section>

      {localStorage.getItem("jwtToken") && (
        <section className="skills-section">
          <h2 className="section-title animate-slide-left">
            🔗 Suggestions de compétences complémentaires pour vous
          </h2>
          {userSkills.length === 0 ? (
            <p>Ajoutez des compétences à votre profil pour voir des suggestions</p>
          ) : loadingComplementary ? (
            <div className="loading">Chargement des suggestions...</div>
          ) : complementarySkills.length > 0 ? (
            <div className="skills-grid">
              {complementarySkills.map((skill, index) => (
                <Link
                  to={`/marketplace/skills/${skill._id}`}
                  key={skill._id}
                  className="skill-card animate-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={getMediaUrl(skill.imageUrl)} // Changé de getImageUrl à getMediaUrl
                    alt={skill.name}
                    className="skill-image"
                    onError={(e) => (e.target.src = "/placeholder-skill.png")}
                  />
                  <div className="card-content">
                    <h3 className="skill-name">{skill.name}</h3>
                    <p className="skill-description">{skill.description}</p>
                    <div className="skill-meta">
                      <span className="skill-category pulse">{skill.categories[0]}</span>
                      <span className={`skill-level ${skill.level.toLowerCase()}`}>
                        {skill.level}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>Aucune compétence complémentaire trouvée.</p>
          )}
        </section>
      )}

      <section className="skills-section">
        <h2 className="section-title animate-slide-left">🔥 Top 5 Most Demanded Skills</h2>
        <div className="skills-grid">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skill-card shimmer"></div>)
          ) : (
            popularSkills.map((skill, index) => (
              <Link
                to={`/marketplace/skills/${skill._id}`}
                key={skill._id}
                className="skill-card animate-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {skill.imageUrl && (
                  <img
                    src={getMediaUrl(skill.imageUrl)} // Changé de getImageUrl à getMediaUrl
                    alt={skill.name}
                    className="skill-image"
                    onError={(e) => (e.target.src = "/placeholder-skill.png")}
                  />
                )}
                <div className="card-content">
                  <h3 className="skill-name gradient-text">{skill.name}</h3>
                  <p className="skill-description">{skill.description}</p>
                  <div className="skill-meta">
                    <span className="skill-category pulse">{skill.categories.join(", ")}</span>
                    <span className="skill-level">{skill.level}</span>
                  </div>
                  <div className="skill-extra">
                    <span className="skill-popularity">⭐ {skill.popularity}</span>
                    <span className="skill-tags">🏷 {skill.tags.join(", ")}</span>
                    <span className="skill-rating">🌟 {skill.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="skills-section">
        <h2 className="section-title animate-slide-left">📈 Recently Added Skills</h2>
        <div className="skills-grid">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skill-card shimmer"></div>)
          ) : (
            recentSkills.map((skill, index) => (
              <Link
                to={`/marketplace/skills/${skill._id}`}
                key={skill._id}
                className="skill-card animate-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={getMediaUrl(skill.imageUrl)} // Changé de getImageUrl à getMediaUrl
                  alt={skill.name}
                  className="skill-image"
                  onError={(e) => (e.target.src = "/placeholder-skill.png")}
                />
                <div className="card-content">
                  <h3 className="skill-name">{skill.name}</h3>
                  <p className="skill-description">{skill.description}</p>
                  <div className="skill-meta">
                    <span className="skill-category pulse">{skill.categories[0]}</span>
                    <span className={`skill-level ${skill.level.toLowerCase()}`}>
                      {skill.level}
                    </span>
                  </div>
                  <div className="skill-extra">
                    <span className="skill-popularity">⭐ {skill.popularity}</span>
                    <span className="skill-tags">
                      🏷 {skill.tags.length > 0 ? skill.tags[0] : "General"}
                      {skill.tags.length > 1 ? ` +${skill.tags.length - 1}` : ""}
                    </span>
                    <span className="skill-rating">🌟 {skill.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {storyVisible && successStories.length > 0 && (
        <div className="story-overlay">
          <div className="story-viewer">
            <div className="story-progress">
              {successStories.map((_, idx) => (
                <div
                  key={idx}
                  className={`story-progress-bar ${
                    idx === currentStoryIndex
                      ? "active"
                      : idx < currentStoryIndex
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="progress-fill"></div>
                </div>
              ))}
            </div>
            <div className="story-content">
              {successStories[currentStoryIndex].mediaType === "image" ? (
                <img
                  src={getMediaUrl(successStories[currentStoryIndex].media)} // Changé 'image' à 'media'
                  alt={successStories[currentStoryIndex].title}
                  className="story-image"
                  onError={(e) => (e.target.src = "/placeholder-story.png")}
                />
              ) : (
                <video
                  src={getMediaUrl(successStories[currentStoryIndex].media)} // Changé 'image' à 'media'
                  className="story-video"
                  controls
                  autoPlay
                  onError={(e) => console.error("Video loading error")}
                />
              )}
              <div className="story-header">
                <div className="story-user-info">
                  <img
                    src={getMediaUrl(successStories[currentStoryIndex].userImage)} // Changé de getImageUrl à getMediaUrl
                    alt={successStories[currentStoryIndex].userName}
                    className="story-user-avatar"
                    onError={(e) => (e.target.src = "/placeholder-user.png")}
                  />
                  <div>
                    <h3>{successStories[currentStoryIndex].userName}</h3>
                    <span>{successStories[currentStoryIndex].skillName}</span>
                    <small className="story-timestamp">
                      {new Date(
                        successStories[currentStoryIndex].createdAt
                      ).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <button className="close-story" onClick={closeStoryViewer}>
                  ✖
                </button>
              </div>
              <div className="story-text">
                <h2 className="story-title">{successStories[currentStoryIndex].title}</h2>
                <p>{successStories[currentStoryIndex].content}</p>
                <Link
                  to={`/marketplace/skills/${successStories[currentStoryIndex].skillId}`}
                  className="btn story-action"
                >
                  Explore this skill
                </Link>
              </div>
            </div>
            <button className="story-nav prev" onClick={() => navigateStory("prev")}>
              ‹
            </button>
            <button className="story-nav next" onClick={() => navigateStory("next")}>
              ›
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setModalOpen(false)}>
              ✖
            </button>
            <h2>Add a skill</h2>
            <form encType="multipart/form-data">
              <input type="text" placeholder="Skill name" required />
              <input type="text" placeholder="Description" required />
              <input type="text" placeholder="Categories (comma separated)" required />
              <input type="text" placeholder="Level" required />
              <input type="number" placeholder="Popularity" />
              <input type="text" placeholder="Tags (comma separated)" />
              <input type="file" accept="image/*" required />
              <button type="submit" className="btn submit">
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {storyModalOpen && (
        <div className="modal story-modal">
          <div className="modal-content">
            <button
              className="close-modal"
              onClick={() => {
                if (imagePreview && imagePreview.startsWith("blob:")) {
                  URL.revokeObjectURL(imagePreview);
                }
                setStoryModalOpen(false);
                setImagePreview(null);
                setNewStory({ title: "", content: "", skillId: "", media: null });
              }}
            >
              ✖
            </button>
            <h2>Share your success story</h2>
            <form onSubmit={handleCreateStory} encType="multipart/form-data">
              <input
                type="text"
                name="title"
                placeholder="Title of your story"
                value={newStory.title}
                onChange={handleStoryInputChange}
                required
              />
              <textarea
                name="content"
                placeholder="Share your experience..."
                value={newStory.content}
                onChange={handleStoryInputChange}
                required
                rows={4}
              />
              <select
                name="skillId"
                value={newStory.skillId}
                onChange={handleStoryInputChange}
                required
              >
                <option value="">Choose a skill</option>
                {availableSkills.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <div className="file-input-container">
                <input
                  type="file"
                  accept="image/*,video/*" // Ajout de video/*
                  ref={fileInputRef}
                  onChange={handleStoryMediaChange}
                  name="media" // Ajouté pour cohérence
                  required
                />
                <button
                  type="button"
                  className="select-image-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  Choose media
                </button>
                {imagePreview && (
                  <div className="image-preview">
                    {newStory.media.type.startsWith("image/") ? (
                      <img src={imagePreview} alt="Preview" />
                    ) : (
                      <video src={imagePreview} controls />
                    )}
                  </div>
                )}
              </div>
              <button type="submit" className="btn submit">
                Share
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;