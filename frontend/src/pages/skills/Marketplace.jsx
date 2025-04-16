import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Marketplace.css";

const Marketplace = () => {
  const [popularSkills, setPopularSkills] = useState([]);
  const [recentSkills, setRecentSkills] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [viewedStories, setViewedStories] = useState(new Set());
  const [loading, setLoading] = useState({
    stories: true,
    popularSkills: true,
    recentSkills: true,
    categories: true,
  });
  const [error, setError] = useState({
    stories: null,
    categories: null,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentStoryUserId, setCurrentStoryUserId] = useState(null);
  const [storyVisible, setStoryVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [newStory, setNewStory] = useState({
    title: "",
    content: "",
    category: "",
    media: null,
    textStyle: { color: "#ffffff", fontSize: "16px", position: "center" },
  });
  const [newSkillSuggestion, setNewSkillSuggestion] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storiesByUser, setStoriesByUser] = useState({});
  const [activeUserIndex, setActiveUserIndex] = useState(0);
  
  const fileInputRef = useRef(null);
  const storyTimeout = useRef(null);
  const videoRef = useRef(null);
  const progressAnimationRef = useRef(null);
  const progressInterval = useRef(null);

  const API_BASE_URL = "http://localhost:5000";
  const DEFAULT_CLOUDINARY_URL = "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg";
  const STORY_DURATION = 5000;

  useEffect(() => {
    console.log("modalOpen state:", modalOpen);
  }, [modalOpen]);

  useEffect(() => {
    console.log("storyModalOpen state:", storyModalOpen);
  }, [storyModalOpen]);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchPopularSkills(),
        fetchRecentSkills(),
        loadStories(),
        fetchCategories(),
      ]);
    };
    fetchData();

    return () => {
      clearAllTimeouts();
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  const clearAllTimeouts = () => {
    if (storyTimeout.current) clearTimeout(storyTimeout.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (progressAnimationRef.current) cancelAnimationFrame(progressAnimationRef.current);
  };

  useEffect(() => {
    const groupedStories = {};
    const validStories = successStories.filter(story => {
      if (!story.userId) {
        console.warn("Skipping story missing userId:", story);
        return false;
      }
      return true;
    });
    validStories.forEach(story => {
      const userId = story.userId;
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          userId,
          userName: story.userName || "Utilisateur",
          userImage: story.userImage || DEFAULT_CLOUDINARY_URL,
          stories: []
        };
      }
      groupedStories[userId].stories.push(story);
    });
    setStoriesByUser(groupedStories);
  }, [successStories]);

  useEffect(() => {
    if (storyVisible && currentStoryUserId && storiesByUser[currentStoryUserId]) {
      const userStories = storiesByUser[currentStoryUserId].stories;
      const story = userStories[currentStoryIndex];
      
      if (!story) return;
      
      if (isPaused) return;
      
      clearAllTimeouts();
      
      let duration = STORY_DURATION;
      if (story.mediaType === "video" && videoRef.current?.duration) {
        duration = videoRef.current.duration * 1000;
      }
      
      setStoryProgress(0);
      
      let startTime = null;
      const animateProgress = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setStoryProgress(progress);
        
        if (progress < 1 && !isPaused) {
          progressAnimationRef.current = requestAnimationFrame(animateProgress);
        }
      };
      
      progressAnimationRef.current = requestAnimationFrame(animateProgress);
      
      storyTimeout.current = setTimeout(() => navigateStory("next"), duration);
      
      if (story.mediaType === "video" && videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().catch((error) => console.error("Video playback error:", error));
      }
      
      return () => clearAllTimeouts();
    }
  }, [storyVisible, currentStoryUserId, currentStoryIndex, storiesByUser, isPaused]);

  useEffect(() => {
    if (storyVisible && currentStoryUserId && storiesByUser[currentStoryUserId]) {
      const userStories = storiesByUser[currentStoryUserId].stories;
      const nextStoryIndex = currentStoryIndex < userStories.length - 1 ? currentStoryIndex + 1 : 0;
      
      if (nextStoryIndex === 0) {
        const userIds = Object.keys(storiesByUser);
        const currentUserIdIndex = userIds.indexOf(currentStoryUserId);
        if (currentUserIdIndex < userIds.length - 1) {
          const nextUserId = userIds[currentUserIdIndex + 1];
          const nextUserStory = storiesByUser[nextUserId]?.stories[0];
          
          if (nextUserStory && nextUserStory.media) {
            preloadMedia(nextUserStory.media, nextUserStory.mediaType);
          }
        }
      } else {
        const nextStory = userStories[nextStoryIndex];
        if (nextStory && nextStory.media) {
          preloadMedia(nextStory.media, nextStory.mediaType);
        }
      }
    }
  }, [storyVisible, currentStoryUserId, currentStoryIndex, storiesByUser]);

  const preloadMedia = (mediaUrl, mediaType) => {
    const url = getMediaUrl(mediaUrl);
    
    if (mediaType === "video" || url.match(/\.(mp4|webm|ogg)$/i)) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
    } else {
      const img = new Image();
      img.src = url;
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading((prev) => ({ ...prev, categories: true }));
      setError((prev) => ({ ...prev, categories: null }));
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        window.location.href = "/login";
        throw new Error("Authentication token missing");
      }
      const res = await fetch(`${API_BASE_URL}/api/skills/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      console.log("Categories fetched:", data.data);
      setCategories(data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error.message);
      setError((prev) => ({ ...prev, categories: error.message }));
      setCategories([]);
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  const handleSuggestSkill = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.error("🚫 Please log in to suggest a skill.");
      window.location.href = "/login";
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, stories: true }));
      const response = await fetch(`${API_BASE_URL}/api/skills/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSkillSuggestion),
      });
      if (!response.ok) throw new Error("Error submitting suggestion.");
      setModalOpen(false);
      setNewSkillSuggestion({ name: "", description: "", category: "" });
      toast.success("🎉 Suggestion submitted successfully!");
    } catch (error) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, stories: false }));
    }
  };

  const handleSkillSuggestionChange = (e) => {
    const { name, value } = e.target;
    setNewSkillSuggestion((prev) => ({ ...prev, [name]: value }));
  };

  const fetchPopularSkills = async () => {
    try {
      setLoading((prev) => ({ ...prev, popularSkills: true }));
      const res = await fetch(`${API_BASE_URL}/api/skills?sort=popular`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setPopularSkills(data.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching popular skills:", error);
      setPopularSkills([]);
    } finally {
      setLoading((prev) => ({ ...prev, popularSkills: false }));
    }
  };

  const fetchRecentSkills = async () => {
    try {
      setLoading((prev) => ({ ...prev, recentSkills: true }));
      const res = await fetch(`${API_BASE_URL}/api/skills?sort=recent`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setRecentSkills(data.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent skills:", error);
      setRecentSkills([]);
    } finally {
      setLoading((prev) => ({ ...prev, recentSkills: false }));
    }
  };

  const loadStories = async () => {
    try {
      setLoading((prev) => ({ ...prev, stories: true }));
      setError((prev) => ({ ...prev, stories: null }));
      const token = localStorage.getItem("jwtToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/api/stories`, { headers });
      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized - Please log in");
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      console.log("Stories fetched:", data.data);
      const storiesWithDefaults = (data.data || []).map((story) => ({
        ...story,
        title: story.title || "Unknown Title",
        content: story.content || "Unknown Content",
        media: story.media && !story.media.includes("undefined") ? story.media : DEFAULT_CLOUDINARY_URL,
        mediaType: story.mediaType || (story.media && story.media.endsWith(".mp4") ? "video" : "image"),
        userName: story.userName || "User",
        userImage: story.userImage || DEFAULT_CLOUDINARY_URL,
        textStyle: story.textStyle || { color: "#ffffff", fontSize: "16px", position: "center" },
        timestamp: story.createdAt || new Date().toISOString(),
      }));
      setSuccessStories([...storiesWithDefaults]);
    } catch (error) {
      console.error("Error loading stories:", error.message);
      setError((prev) => ({ ...prev, stories: `Failed to load stories: ${error.message}` }));
      setSuccessStories([]);
    } finally {
      setLoading((prev) => ({ ...prev, stories: false }));
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.error("🚫 Please log in to share a story.");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, stories: true }));
      const formData = new FormData();
      formData.append("title", newStory.title);
      formData.append("content", newStory.content);
      formData.append("category", newStory.category);
      formData.append("textStyle", JSON.stringify(newStory.textStyle));
      if (newStory.media) {
        formData.append("media", newStory.media);
        const mediaType = newStory.media.type.startsWith("image/") ? "image" : "video";
        formData.append("mediaType", mediaType);
      } else {
        throw new Error("No media file selected.");
      }
      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.message.includes("File too large")) throw new Error("File is too large (limit: 10MB).");
        if (data.message.includes("Only images and videos are allowed")) throw new Error("Only images and videos are allowed.");
        throw new Error(data.message || "Creation error.");
      }
      setStoryModalOpen(false);
      setNewStory({ title: "", content: "", category: "", media: null, textStyle: { color: "#ffffff", fontSize: "16px", position: "center" } });
      setImagePreview(null);
      await loadStories();
      toast.success("🎉 Story published successfully!");
    } catch (error) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, stories: false }));
    }
  };

  const getMediaUrl = (mediaUrl) => {
    return mediaUrl && !mediaUrl.includes("undefined") ? mediaUrl : DEFAULT_CLOUDINARY_URL;
  };

  const openStory = (userId, index = 0) => {
    setCurrentStoryUserId(userId);
    setCurrentStoryIndex(index);
    setStoryVisible(true);
    setIsPaused(false);
    setStoryProgress(0);
    setViewedStories((prev) => {
      const newSet = new Set(prev);
      newSet.add(`${userId}-${index}`);
      return newSet;
    });
    
    clearAllTimeouts();
    
    const userStories = storiesByUser[userId]?.stories;
    if (!userStories || !userStories[index]) return;
    
    const story = userStories[index];
    let duration = STORY_DURATION;
    
    if (story.mediaType === "video" && videoRef.current?.duration) {
      duration = videoRef.current.duration * 1000;
    }
    
    let startTime = null;
    const animateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setStoryProgress(progress);
      
      if (progress < 1 && !isPaused) {
        progressAnimationRef.current = requestAnimationFrame(animateProgress);
      }
    };
    
    progressAnimationRef.current = requestAnimationFrame(animateProgress);
    
    storyTimeout.current = setTimeout(() => navigateStory("next"), duration);
  };

  const navigateStory = (direction) => {
    if (isPaused) return;
    clearAllTimeouts();
    
    const userIds = Object.keys(storiesByUser);
    if (!userIds.length || !currentStoryUserId) return;
    
    const currentUserIdIndex = userIds.indexOf(currentStoryUserId);
    const userStories = storiesByUser[currentStoryUserId]?.stories || [];
    
    let nextUserIndex = currentUserIdIndex;
    let nextStoryIndex = currentStoryIndex;
    
    if (direction === "next") {
      if (currentStoryIndex < userStories.length - 1) {
        nextStoryIndex = currentStoryIndex + 1;
      } else if (currentUserIdIndex < userIds.length - 1) {
        nextUserIndex = currentUserIdIndex + 1;
        nextStoryIndex = 0;
      } else {
        setStoryVisible(false);
        return;
      }
    } else {
      if (currentStoryIndex > 0) {
        nextStoryIndex = currentStoryIndex - 1;
      } else if (currentUserIdIndex > 0) {
        nextUserIndex = currentUserIdIndex - 1;
        const prevUserStories = storiesByUser[userIds[nextUserIndex]]?.stories || [];
        nextStoryIndex = prevUserStories.length - 1;
      }
    }
    
    const nextUserId = userIds[nextUserIndex];
    
    setCurrentStoryUserId(nextUserId);
    setCurrentStoryIndex(nextStoryIndex);
    setStoryProgress(0);
    setViewedStories((prev) => {
      const newSet = new Set(prev);
      newSet.add(`${nextUserId}-${nextStoryIndex}`);
      return newSet;
    });
    
    const story = storiesByUser[nextUserId]?.stories[nextStoryIndex];
    if (!story) return;
    
    let duration = STORY_DURATION;
    if (story.mediaType === "video" && videoRef.current?.duration) {
      duration = videoRef.current.duration * 1000;
    }
    
    let startTime = null;
    const animateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setStoryProgress(progress);
      
      if (progress < 1 && !isPaused) {
        progressAnimationRef.current = requestAnimationFrame(animateProgress);
      }
    };
    
    progressAnimationRef.current = requestAnimationFrame(animateProgress);
    
    storyTimeout.current = setTimeout(() => navigateStory("next"), duration);
    
    if (story.mediaType === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.error(err));
    }
  };

  const togglePause = () => {
    if (isPaused) {
      let remainingTime = STORY_DURATION;
      const userStories = storiesByUser[currentStoryUserId]?.stories || [];
      const story = userStories[currentStoryIndex];
      
      if (story?.mediaType === "video" && videoRef.current) {
        const videoDuration = videoRef.current.duration * 1000;
        const elapsedTime = videoRef.current.currentTime * 1000;
        remainingTime = videoDuration - elapsedTime;
        videoRef.current.play().catch(err => console.error(err));
      } else {
        remainingTime = STORY_DURATION * (1 - storyProgress);
      }
      
      storyTimeout.current = setTimeout(() => navigateStory("next"), remainingTime);
      
      const startProgress = storyProgress;
      let startTime = null;
      
      const animateRemainingProgress = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const totalDuration = remainingTime / (1 - startProgress);
        const progress = Math.min(startProgress + (elapsed / totalDuration) * (1 - startProgress), 1);
        
        setStoryProgress(progress);
        
        if (progress < 1 && !isPaused) {
          progressAnimationRef.current = requestAnimationFrame(animateRemainingProgress);
        }
      };
      
      progressAnimationRef.current = requestAnimationFrame(animateRemainingProgress);
    } else {
      clearAllTimeouts();
      if (videoRef.current && storiesByUser[currentStoryUserId]?.stories[currentStoryIndex]?.mediaType === "video") {
        videoRef.current.pause();
      }
    }
    
    setIsPaused(!isPaused);
  };

  const closeStoryViewer = () => {
    clearAllTimeouts();
    setStoryVisible(false);
    setIsPaused(false);
    setStoryProgress(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleStoryInputChange = (e) => {
    const { name, value } = e.target;
    setNewStory((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextStyleChange = (e) => {
    const { name, value } = e.target;
    setNewStory((prev) => ({
      ...prev,
      textStyle: { ...prev.textStyle, [name]: value },
    }));
  };

  const handleStoryMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      setNewStory((prev) => ({ ...prev, media: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStart;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) navigateStory("prev");
      else navigateStory("next");
    }
    
    setTouchStart(null);
  };

  const renderStoriesContent = () => {
    if (loading.stories) {
      return [...Array(5)].map((_, i) => (
        <div key={`shimmer-${i}`} className="story-circle shimmer"></div>
      ));
    }
    
    if (error.stories) {
      return <div className="error-message">{error.stories}</div>;
    }

    const userIds = Object.keys(storiesByUser);
    
    if (userIds.length === 0) {
      return (
        <>
          <div
            key="create-story"
            className="story-circle create-story"
            onClick={() => {
              console.log("Opening Add Your Story modal from circle (no stories)");
              setStoryModalOpen(true);
            }}
          >
            <div className="story-circle-border">
              <div className="create-story-icon">+</div>
            </div>
            <span className="story-username">Your story</span>
          </div>
          <div key="no-stories" className="no-stories-message">No stories available. Share yours!</div>
        </>
      );
    }

    return (
      <>
        <div
          key="create-story"
          className="story-circle create-story"
          onClick={() => {
            console.log("Opening Add Your Story modal from circle");
            setStoryModalOpen(true);
          }}
          role="button"
          aria-label="Create a new story"
        >
          <div className="story-circle-border">
            <div className="create-story-icon">+</div>
          </div>
          <span className="story-username">Your story</span>
        </div>
        {userIds.map((userId, index) => {
          const user = storiesByUser[userId];
          const hasUnviewed = user.stories.some((_, storyIndex) => 
            !viewedStories.has(`${userId}-${storyIndex}`)
          );
          
          return (
            <div
              key={userId}
              className={`story-circle animate-pop-in ${hasUnviewed ? "" : "viewed"}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => openStory(userId, 0)}
              role="button"
              aria-label={`View ${user.userName}'s story`}
            >
              <div className={`story-circle-border ${hasUnviewed ? "unviewed" : ""}`}>
                <img
                  src={getMediaUrl(user.userImage)}
                  alt={`${user.userName}'s profile`}
                  className="story-user-image"
                  onError={(e) => (e.target.src = DEFAULT_CLOUDINARY_URL)}
                />
              </div>
              <span className="story-username">{user.userName?.split(" ")[0].substring(0, 6) || "User"}</span>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="marketplace-container">
      <ToastContainer />
      <header className="header">
        <h1 className="title animate-pop-in">Welcome to the Skills Marketplace</h1>
        <p className="subtitle animate-pop-in delay-1">
          Discover and exchange skills with experts from around the world.
        </p>
      </header>

      <div className="buttons-container">
        <Link to="/marketplaceSkills" className="btn explore">
          <span className="btn-icon">🔍</span> Search Skills
        </Link>
        <button
          onClick={() => {
            console.log("Opening Suggest a Skill modal");
            setModalOpen(true);
          }}
          className="btn add"
        >
          <span className="btn-icon">💡</span> Suggest a Skill
        </button>
      </div>

      <section className="success-stories-section">
        <div className="stories-header">
          <h2 className="section-title animate-slide-left">✨ Success Stories</h2>
          <button
            className="add-story-btn"
            onClick={() => {
              console.log("Opening Add Your Story modal from header");
              setStoryModalOpen(true);
            }}
          >
            + Add Your Story
          </button>
        </div>
        <div className="stories-container">{renderStoriesContent()}</div>
      </section>

      <section className="skills-section">
        <h2 className="section-title animate-slide-left">🔥 Top 5 Most Requested Skills</h2>
        <div className="skills-grid">
          {loading.popularSkills
            ? [...Array(5)].map((_, i) => <div key={`popular-shimmer-${i}`} className="skill-card shimmer"></div>)
            : popularSkills.map((skill, index) => (
                <Link
                  to={`/marketplace/skills/${skill._id}`}
                  key={skill._id}
                  className="skill-card animate-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={getMediaUrl(skill.imageUrl)}
                    alt={skill.name}
                    className="skill-image"
                    onError={(e) => (e.target.src = DEFAULT_CLOUDINARY_URL)}
                  />
                  <div className="card-content">
                    <h3 className="skill-name">{skill.name}</h3>
                    <p className="skill-description">{skill.description}</p>
                    <div className="skill-meta">
                      <span className="skill-category pulse">{skill.categories.join(", ")}</span>
                      <span className="skill-level">{skill.level}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      <section className="skills-section">
        <h2 className="section-title animate-slide-left">📈 Recently Added Skills</h2>
        <div className="skills-grid">
          {loading.recentSkills
            ? [...Array(5)].map((_, i) => <div key={`recent-shimmer-${i}`} className="skill-card shimmer"></div>)
            : recentSkills.map((skill, index) => (
                <Link
                  to={`/marketplace/skills/${skill._id}`}
                  key={skill._id}
                  className="skill-card animate-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={getMediaUrl(skill.imageUrl)}
                    alt={skill.name}
                    className="skill-image"
                    onError={(e) => (e.target.src = DEFAULT_CLOUDINARY_URL)}
                  />
                  <div className="card-content">
                    <h3 className="skill-name">{skill.name}</h3>
                    <p className="skill-description">{skill.description}</p>
                    <div className="skill-meta">
                      <span className="skill-category pulse">{skill.categories[0]}</span>
                      <span className={`skill-level ${skill.level.toLowerCase()}`}>{skill.level}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {storyVisible && currentStoryUserId && storiesByUser[currentStoryUserId] && (
        <div className="story-overlay" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="story-viewer">
            <div className="story-header">
              <div className="story-user-info">
                <img
                  src={getMediaUrl(storiesByUser[currentStoryUserId].userImage)}
                  alt={`${storiesByUser[currentStoryUserId].userName}'s profile`}
                  className="story-user-pic"
                  onError={(e) => (e.target.src = DEFAULT_CLOUDINARY_URL)}
                />
                <div className="story-user-details">
                  <div className="story-user-name">{storiesByUser[currentStoryUserId].userName}</div>
                  <div className="story-timestamp">
                    {new Date(storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="story-controls">
                <button onClick={togglePause} className="story-control-btn">
                  {isPaused ? "▶️" : "⏸️"}
                </button>
                <button onClick={closeStoryViewer} className="story-control-btn">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="story-progress-container">
              {storiesByUser[currentStoryUserId].stories.map((_, index) => (
                <div key={`progress-${index}`} className="story-progress-bar-container">
                  <div
                    className={`story-progress-bar ${index < currentStoryIndex ? 'completed' : index === currentStoryIndex ? 'active' : ''}`}
                    style={{ width: index === currentStoryIndex ? `${storyProgress * 100}%` : index < currentStoryIndex ? '100%' : '0%' }}
                  ></div>
                </div>
              ))}
            </div>
            
            <div className="story-content">
              {storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.mediaType === "video" ? (
                <video
                  ref={videoRef}
                  className="story-media"
                  src={getMediaUrl(storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.media)}
                  autoPlay
                  muted
                  playsInline
                  onError={(e) => {
                    console.error("Video error:", e);
                    e.target.src = DEFAULT_CLOUDINARY_URL;
                  }}
                />
              ) : (
                <img
                  className="story-media"
                  src={getMediaUrl(storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.media)}
                  alt="Story"
                  onError={(e) => (e.target.src = DEFAULT_CLOUDINARY_URL)}
                />
              )}
              
              <div
                className="story-text"
                style={{
                  color: storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.textStyle?.color || "#ffffff",
                  fontSize: storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.textStyle?.fontSize || "16px",
                  textAlign: storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.textStyle?.position || "center"
                }}
              >
                <h3>{storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.title}</h3>
                <p>{storiesByUser[currentStoryUserId].stories[currentStoryIndex]?.content}</p>
              </div>
            </div>
            
            <div className="story-navigation">
              <button
                className="story-nav-btn prev"
                onClick={() => navigateStory("prev")}
                aria-label="Previous story"
              ></button>
              <button
                className="story-nav-btn next"
                onClick={() => navigateStory("next")}
                aria-label="Next story"
              ></button>
            </div>
          </div>
        </div>
      )}
      
      {storyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content story-modal">
            <div className="modal-header">
              <h2>Share Your Success Story</h2>
              <button
                onClick={() => {
                  setStoryModalOpen(false);
                  setNewStory({
                    title: "",
                    content: "",
                    category: "",
                    media: null,
                    textStyle: { color: "#ffffff", fontSize: "16px", position: "center" },
                  });
                  setImagePreview(null);
                }}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStory} className="story-form">
              <div className="form-group">
                <label htmlFor="story-title">Title</label>
                <input
                  type="text"
                  id="story-title"
                  name="title"
                  value={newStory.title}
                  onChange={handleStoryInputChange}
                  placeholder="Enter a catchy title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="story-content">Your Story</label>
                <textarea
                  id="story-content"
                  name="content"
                  value={newStory.content}
                  onChange={handleStoryInputChange}
                  placeholder="Share your experience..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="story-category">Category</label>
                <select
                  id="story-category"
                  name="category"
                  value={newStory.category}
                  onChange={handleStoryInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="story-media">Media</label>
                <input
                  type="file"
                  id="story-media"
                  name="media"
                  accept="image/*,video/*"
                  onChange={handleStoryMediaChange}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="file-select-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  {newStory.media ? "Change File" : "Select Image or Video"}
                </button>
                <span className="file-name">
                  {newStory.media ? newStory.media.name : "No file selected"}
                </span>
              </div>
              
              {imagePreview && (
                <div className="image-preview">
                  {newStory.media?.type.startsWith("image/") ? (
                    <img src={imagePreview} alt="Preview" />
                  ) : (
                    <video src={imagePreview} controls />
                  )}
                </div>
              )}
              
              <button type="submit" className="submit-btn" disabled={loading.stories}>
                {loading.stories ? "Publishing..." : "Share Your Story"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Suggest a New Skill</h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setNewSkillSuggestion({ name: "", description: "", category: "" });
                }}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSuggestSkill} className="suggestion-form">
              <div className="form-group">
                <label htmlFor="skill-name">Skill Name</label>
                <input
                  type="text"
                  id="skill-name"
                  name="name"
                  value={newSkillSuggestion.name}
                  onChange={handleSkillSuggestionChange}
                  placeholder="Enter skill name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="skill-description">Description</label>
                <textarea
                  id="skill-description"
                  name="description"
                  value={newSkillSuggestion.description}
                  onChange={handleSkillSuggestionChange}
                  placeholder="Describe the skill and its benefits"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="skill-category">Category</label>
                <select
                  id="skill-category"
                  name="category"
                  value={newSkillSuggestion.category}
                  onChange={handleSkillSuggestionChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading.stories}>
                {loading.stories ? "Submitting..." : "Submit Suggestion"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <footer className="marketplace-footer">
        <div className="footer-content">
          <p>© 2025 Skills Exchange Platform. All rights reserved.</p>
          <p>
            <Link to="/terms">Terms of Service</Link> |
            <Link to="/privacy">Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Marketplace;