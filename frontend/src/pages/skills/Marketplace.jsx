import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./Marketplace.css";

const Marketplace = () => {
  const [popularSkills, setPopularSkills] = useState([]);
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
    image: null
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const storyTimeout = useRef(null);
  
  // Base URL for the API
  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    // Load skills and stats
    fetchPopularSkills();
    fetchRecentSkills();
    fetchStats();
    fetchAvailableSkills();
    
    // Load success stories
    loadStories();

    return () => {
      // Clear timeout if component unmounts
      if (storyTimeout.current) {
        clearTimeout(storyTimeout.current);
      }
    };
  }, []);

  // Fetch popular skills
  const fetchPopularSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills?sort=popular`);
      if (!res.ok) {
        throw new Error(`Failed to fetch popular skills: ${res.status}`);
      }
      const data = await res.json();
      setPopularSkills(data.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching popular skills:", error);
    }
  };

  // Fetch recent skills
  const fetchRecentSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills?sort=recent`);
      if (!res.ok) {
        throw new Error(`Failed to fetch recent skills: ${res.status}`);
      }
      const data = await res.json();
      setRecentSkills(data.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent skills:", error);
    }
  };

  // Fetch marketplace stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`);
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch all skills for story creation dropdown
  const fetchAvailableSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills`);
      if (!res.ok) {
        throw new Error(`Failed to fetch skills: ${res.status}`);
      }
      const data = await res.json();
      setAvailableSkills(data.data);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  // Load success stories function - fixed to properly handle authentication
  const loadStories = async () => {
    try {
      setLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('jwtToken');
      
      // If no token, set an empty array for stories and exit gracefully without error
      if (!token) {
        console.log("User not authenticated. Showing default stories view.");
        setSuccessStories([]);
        setLoading(false);
        return;
      }
      
      // Make sure token is properly formatted
      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        // Handle expired or invalid token
        console.warn("Authentication token invalid or expired.");
        localStorage.removeItem('jwtToken'); // Clear invalid token
        setSuccessStories([]);
        setError("Votre session a expiré. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setSuccessStories(data.data);
        setError(null); // Clear any previous errors
      } else {
        setSuccessStories([]);
        setError("Impossible de charger les stories. Format de données inattendu.");
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setError('Failed to load stories. Please try again later.');
      setSuccessStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new story
 // Create a new story
 const handleCreateStory = async (e) => {
    e.preventDefault();
    
    // Get authentication token
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      alert("Veuillez vous connecter pour partager votre story");
      return;
    }
    
    try {
      setLoading(true);
      
      // Create FormData to send file + text data
      const formData = new FormData();
      formData.append('title', newStory.title);
      formData.append('content', newStory.content);
      formData.append('skillId', newStory.skillId);
      
      if (newStory.image) {
        formData.append('image', newStory.image);
      }
      
      // Get the currently logged in user's ID from localStorage or context
      const userId = localStorage.getItem('userId');
      if (userId) {
        formData.append('userId', userId);
      }
      
      console.log("Sending story data:", {
        title: newStory.title,
        content: newStory.content,
        skillId: newStory.skillId,
        image: newStory.image ? newStory.image.name : "No image",
        userId: userId || "No userId"
      });
      
      // Submit to API with authorization header
      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
          // Do not set Content-Type header for FormData
        },
        credentials: 'include' // Include cookies if your server uses them
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error! Status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Success response:", data);
      
      // Close modal and reset form
      setStoryModalOpen(false);
      setNewStory({
        title: "",
        content: "",
        skillId: "",
        image: null
      });
      setImagePreview(null);
      
      // Reload stories to show the new one
      loadStories();
      
      // Show success message
      alert("Votre story a été publiée avec succès!");
    } catch (error) {
      console.error("Error creating story:", error);
      alert(`Une erreur s'est produite: ${error.message}`);
    } finally {
      setLoading(false);
    }
};

  // Helper function to construct image URLs correctly
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/placeholder-image.png';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  };

  // Story navigation functions
  const openStory = (index) => {
    setCurrentStoryIndex(index);
    setStoryVisible(true);
    
    // Auto-close story after 10 seconds
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    
    storyTimeout.current = setTimeout(() => {
      navigateStory('next');
    }, 10000);
  };

  const navigateStory = (direction) => {
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    
    if (direction === 'next') {
      const nextIndex = currentStoryIndex < successStories.length - 1 ? currentStoryIndex + 1 : 0;
      
      if (nextIndex === 0 && currentStoryIndex === successStories.length - 1) {
        // If we've reached the end of all stories, close the viewer
        setStoryVisible(false);
      } else {
        setCurrentStoryIndex(nextIndex);
        
        storyTimeout.current = setTimeout(() => {
          navigateStory('next');
        }, 10000);
      }
    } else {
      setCurrentStoryIndex((prev) => 
        prev > 0 ? prev - 1 : successStories.length - 1
      );
      
      storyTimeout.current = setTimeout(() => {
        navigateStory('next');
      }, 10000);
    }
  };

  const closeStoryViewer = () => {
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    setStoryVisible(false);
  };

  // Form input handlers
  const handleStoryInputChange = (e) => {
    const { name, value } = e.target;
    setNewStory((prevStory) => ({
      ...prevStory,
      [name]: value
    }));
  };

  const handleStoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewStory((prevStory) => ({
        ...prevStory,
        image: file
      }));
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Render stories content based on state
  const renderStoriesContent = () => {
    if (loading) {
      return [...Array(5)].map((_, i) => (
        <div key={i} className="story-circle shimmer"></div>
      ));
    }
    
    if (error) {
      return (
        <div className="error-message">
          {error}
          {error.includes("session a expiré") && (
            <button 
              onClick={() => window.location.href = '/login'} 
              className="login-btn"
            >
              Se reconnecter
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
              src={getImageUrl(story.userImage)} 
              alt={story.userName}
              className="story-user-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-user.png';
              }}
            />
          </div>
          <span className="story-username">{story.userName?.split(' ')[0] || 'User'}</span>
        </div>
      ));
    }
    
    return (
      <div className="no-stories-message">
        {localStorage.getItem('jwtToken') 
          ? "Aucune story disponible. Soyez le premier à partager votre expérience!"
          : "Connectez-vous pour voir et partager des success stories."}
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
          📚 Total Skills Available: {stats.totalSkills}
        </p>
      </header>

      {/* Display error message if there is one */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="buttons-container">
        <Link to="/marketplaceSkills" className="btn explore hover-glow">
          <span className="btn-icon">🔍</span>
          <span>Search for Skills</span>
        </Link>
        <button onClick={() => setModalOpen(true)} className="btn add hover-glow">
          <span className="btn-icon">➕</span>
          <span>Offer a Skill</span>
        </button>
      </div>

      {/* Success Stories Section */}
      <section className="success-stories-section">
        <div className="stories-header">
          <h2 className="section-title animate-slide-left">✨ Success Stories</h2>
          <button 
            className="add-story-btn"
            onClick={() => {
                // Check if user is logged in
                const token = localStorage.getItem('jwtToken');
                if (!token) {
                  alert("Please log in to share your story.");
                  return;
                }
                setStoryModalOpen(true);
              }}
          >
            + Add Your Story
          </button>
        </div>
        
        <div className="stories-container">
          {/* Add Story Option */}
          <div 
            className="story-circle add-story animate-pop-in"
            onClick={() => {
              // Check if user is logged in
              const token = localStorage.getItem('jwtToken');
              if (!token) {
                alert("Please log in to share your story.");
                return;
              }
              setStoryModalOpen(true);
            }}
          >
            <div className="story-circle-border add">
              <div className="add-icon">+</div>
            </div>
            <span className="story-username">Add Story</span>
          </div>
          
          {/* Story Circles - Dynamic Content */}
          {renderStoriesContent()}
        </div>
      </section>

      {/* Top Skills */}
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
                    src={getImageUrl(skill.imageUrl)} 
                    alt={skill.name} 
                    className="skill-image" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-skill.png'; // Fallback image
                    }}
                  />
                )}
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
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Recent Skills */}
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
                  className="skill-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img 
                    src={getImageUrl(skill.imageUrl)} 
                    alt={skill.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-skill.png';
                    }}
                  />
                  
                  <div className="card-content">
                    <h3 className="skill-name">{skill.name}</h3>
                    <p className="skill-description">{skill.description}</p>
                    
                    <div className="skill-meta">
                      <span className="skill-category pulse">{skill.categories[0]}</span>
                      <span className={`skill-level ${skill.level.toLowerCase()}`}>{skill.level}</span>
                    </div>
              
                    <div className="skill-extra">
                      <span className="skill-popularity">⭐ {skill.popularity}</span>
                      <span className="skill-tags">
                        🏷️ {skill.tags.length > 0 ? skill.tags[0] : "General"}
                        {skill.tags.length > 1 ? ` +${skill.tags.length - 1}` : ""}
                      </span>
                      <span className="skill-rating">🌟 {skill.rating.toFixed(1)}</span>
                    </div>
                    
                    {skill.tags.length > 0 && (
                      <div className="tag-items">
                        {skill.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag-item">{tag}</span>
                        ))}
                        {skill.tags.length > 3 && <span className="tag-item">+{skill.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              ))
          )}
        </div>
      </section>

      {/* Full Story Viewer */}
      {storyVisible && successStories.length > 0 && (
        <div className="story-overlay">
          <div className="story-viewer">
            <div className="story-progress">
              {successStories.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`story-progress-bar ${idx === currentStoryIndex ? 'active' : idx < currentStoryIndex ? 'completed' : ''}`}
                >
                  <div className="progress-fill"></div>
                </div>
              ))}
            </div>
            
            <div className="story-content">
              <img 
                src={getImageUrl(successStories[currentStoryIndex].image)}
                alt={successStories[currentStoryIndex].title}
                className="story-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-story.png';
                }}
              />
              
              <div className="story-header">
                <div className="story-user-info">
                  <img 
                    src={getImageUrl(successStories[currentStoryIndex].userImage)}
                    alt={successStories[currentStoryIndex].userName}
                    className="story-user-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-user.png';
                    }}
                  />
                  <div>
                    <h3>{successStories[currentStoryIndex].userName}</h3>
                    <span>{successStories[currentStoryIndex].skillName}</span>
                    <small className="story-timestamp">{new Date(successStories[currentStoryIndex].createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
                <button className="close-story" onClick={closeStoryViewer}>✖</button>
              </div>
              
              <div className="story-text">
                <h2 className="story-title">{successStories[currentStoryIndex].title}</h2>
                <p>{successStories[currentStoryIndex].content}</p>
                <Link 
                  to={`/marketplace/skills/${successStories[currentStoryIndex].skillId}`}
                  className="btn story-action"
                >
                  Explore This Skill
                </Link>
              </div>
            </div>
            
            <button className="story-nav prev" onClick={() => navigateStory('prev')}>‹</button>
            <button className="story-nav next" onClick={() => navigateStory('next')}>›</button>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setModalOpen(false)}>✖</button>
            <h2>Add a Skill</h2>
            <form encType="multipart/form-data">
              <input type="text" placeholder="Skill Name" required />
              <input type="text" placeholder="Description" required />
              <input type="text" placeholder="Categories (comma separated)" required />
              <input type="text" placeholder="Level" required />
              <input type="number" placeholder="Popularity" />
              <input type="text" placeholder="Tags (comma separated)" />
              <input type="file" accept="image/*" required />
              <button type="submit" className="btn submit">Submit</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal to Add Story */}
      {storyModalOpen && (
        <div className="modal story-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={() => {
              setStoryModalOpen(false);
              setImagePreview(null);
              setNewStory({
                title: "",
                content: "",
                skillId: "",
                image: null
              });
            }}>✖</button>
            <h2>Share Your Success Story</h2>
            <form onSubmit={handleCreateStory} encType="multipart/form-data">
              <input 
                type="text" 
                name="title"
                placeholder="Title of your success story" 
                value={newStory.title}
                onChange={handleStoryInputChange}
                required 
              />
              
              <textarea 
                name="content"
                placeholder="Share your experience and how this skill changed your life..." 
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
                <option value="">Select the skill this story is about</option>
                {availableSkills.map(skill => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              
              <div className="file-input-container">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleStoryImageChange}
                  required 
                />
                <button 
                  type="button" 
                  className="select-image-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  Select Image
                </button>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
              
              <button type="submit" className="btn submit">Share Your Story</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;