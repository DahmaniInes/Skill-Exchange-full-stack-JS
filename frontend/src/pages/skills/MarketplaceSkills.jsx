import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MarketplaceStyles.css";

const MarketplaceSkills = () => {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [sortOption, setSortOption] = useState("popularity");
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newStory, setNewStory] = useState({ title: "", content: "", media: null });
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000";

  const token = localStorage.getItem("jwtToken");

  // Generate a consistent color for each tag
  const getTagColor = (tag) => {
    const colors = [
      "#FF5733", "#33A1FF", "#33FF57", "#FF33A8", "#A833FF",
      "#FFD733", "#33FFD7", "#FF8333", "#3369FF", "#FF336E"
    ];
    let hashCode = 0;
    for (let i = 0; i < tag.length; i++) {
      hashCode += tag.charCodeAt(i);
    }
    return colors[hashCode % colors.length];
  };

  // Fetch skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        let url = `${API_BASE_URL}/api/skills?`;
        if (search) url += `query=${encodeURIComponent(search)}&`;
        if (selectedCategories.length > 0) url += `categories=${encodeURIComponent(selectedCategories.join(','))}&`;
        if (selectedLevels.length > 0) url += `levels=${encodeURIComponent(selectedLevels.join(','))}&`;
        if (minRating > 0) url += `minRating=${minRating}&`;
        if (sortOption === "popularity") url += "sort=popular";
        else if (sortOption === "rating") url += "sort=rating";
        else if (sortOption === "newest") url += "sort=recent";

        const response = await fetch(url);
        const data = await response.json();
        if (response.ok) {
          setSkills(data.data || []);
        } else {
          toast.error("Error loading skills");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading skills");
      }
    };
    fetchSkills();
  }, [search, selectedCategories, selectedLevels, minRating, sortOption]);

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      if (!token) {
        toast.error("Please login to view stories");
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/stories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setStories(data.data || []);
        } else {
          toast.error("Error loading stories");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading stories");
      }
    };
    fetchStories();
  }, [token]);

  // Filter and sort skills
  const filteredSkills = skills.filter(skill => {
    const searchMatch = skill.name.toLowerCase().includes(search.toLowerCase());
    const categoryMatch = selectedCategories.length === 0 || 
                         skill.categories.some(c => selectedCategories.includes(c));
    const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(skill.level);
    const ratingMatch = skill.rating >= minRating;
    return searchMatch && categoryMatch && levelMatch && ratingMatch;
  });

  const sortedSkills = [...filteredSkills].sort((a, b) => {
    if (sortOption === "popularity") return b.popularity - a.popularity;
    if (sortOption === "rating") return b.rating - a.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Handle image URLs
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/placeholder-skill.png';
    return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  };

  // Create a new story
  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please login to add a story");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", newStory.title);
      formData.append("content", newStory.content);
      if (newStory.media) formData.append("media", newStory.media);

      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Story added successfully!");
        setStories([...stories, data.data]);
        setShowModal(false);
        setNewStory({ title: "", content: "", media: null });
      } else {
        toast.error("Error adding story");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error adding story");
    }
  };

  return (
    <div className="marketplace-container">
      <ToastContainer />
      <header className="header-section">
  <button onClick={() => navigate(-1)} className="back-button">
    ← Back
  </button>
  <h1 className="main-title gradient-text">🧠 Skills Marketplace</h1>
</header>

      <section className="success-stories-section">
        <h2 className="section-title">✨ Success Stories</h2>
        <button onClick={() => setShowModal(true)} className="add-story-button">
          + Add a story
        </button>
        <div className="stories-container">
          {stories.length > 0 ? (
            stories.map(story => (
              <div key={story._id} className="story-card" onClick={() => setCurrentStory(story)}>
                <div className="story-image-container">
                  <img
                    src={getImageUrl(story.userImage)}
                    alt={story.userName}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-user.png"; }}
                  />
                </div>
                <h3>{story.title}</h3>
                <p className="story-excerpt">{story.content.substring(0, 50)}...</p>
                <span className="story-timestamp">{new Date(story.createdAt).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <p>No stories available at the moment.</p>
          )}
        </div>
      </section>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add a new story</h2>
            <form onSubmit={handleCreateStory}>
              <input
                type="text"
                placeholder="Title"
                value={newStory.title}
                onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Content"
                value={newStory.content}
                onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                required
              />
              <input
                type="file"
                onChange={(e) => setNewStory({ ...newStory, media: e.target.files[0] })}
                accept="image/*,video/*"
                required
              />
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <div className="main-content-wrapper">
        <div className="filters-sidebar">
          <div className="filter-group">
            <h3>📁 Categories</h3>
            {["Development", "Design", "Marketing", "Business", "Languages", "Music", "Art", "Science", "Others"].map(category => (
              <label key={category}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCategories([...selectedCategories, category]);
                    else setSelectedCategories(selectedCategories.filter(c => c !== category));
                  }}
                />
                {category}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h3>🎚 Levels</h3>
            {["Beginner", "Intermediate", "Advanced"].map(level => (
              <label key={level}>
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedLevels([...selectedLevels, level]);
                    else setSelectedLevels(selectedLevels.filter(l => l !== level));
                  }}
                />
                {level}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h3>⭐ Minimum Rating</h3>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
            />
            <span>{minRating}+</span>
          </div>
          <button
            className="reset-button"
            onClick={() => {
              setSelectedCategories([]);
              setSelectedLevels([]);
              setMinRating(0);
            }}
          >
            ⟳ Reset filters
          </button>
        </div>

        <div className="skills-content">
          <div className="search-sort-bar">
            <input
              type="text"
              placeholder="🔍 Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="popularity">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <div className="skills-grid">
            {sortedSkills.length > 0 ? (
              sortedSkills.map(skill => (
                <div key={skill._id} className="skill-card" onClick={() => navigate(`/skills/${skill._id}`)}>
                  <img
                    src={getImageUrl(skill.imageUrl)}
                    alt={skill.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-skill.png"; }}
                  />
                  <div className="card-content">
                    <h3>{skill.name}</h3>
                    <p>{skill.description}</p>
                    <div className="skill-meta">
                      <span className="category">{skill.categories.join(", ")}</span>
                      <span className={`level ${skill.level.toLowerCase()}`}>{skill.level}</span>
                    </div>
                    {skill.tags && skill.tags.length > 0 && (
                      <div className="skill-tags">
                        {skill.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="tag"
                            style={{ 
                              backgroundColor: getTagColor(tag),
                              color: "#fff",
                              textShadow: "0px 0px 1px rgba(0,0,0,0.5)"
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="stats">
                      <span>⭐ {skill.rating.toFixed(1)}</span>
                      <span>👥 {skill.popularity}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No skills found matching your criteria</p>
                <button onClick={() => {
                  setSelectedCategories([]);
                  setSelectedLevels([]);
                  setMinRating(0);
                  setSearch("");
                }}>
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {currentStory && (
        <div className="story-overlay" onClick={() => setCurrentStory(null)}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(currentStory.media)}
              alt={currentStory.title}
              onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-story.png"; }}
            />
            <div className="story-content">
              <h2>{currentStory.title}</h2>
              <p>{currentStory.content}</p>
              <div className="user-info">
                <img
                  src={getImageUrl(currentStory.userImage)}
                  alt={currentStory.userName}
                  onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-user.png"; }}
                />
                <span>{currentStory.userName}</span>
                <span className="story-timestamp">{new Date(currentStory.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSkills;