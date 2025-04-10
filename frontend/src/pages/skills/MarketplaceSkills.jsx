import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MarketplaceStyles.css";

const MarketplaceSkills = () => {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [sortOption, setSortOption] = useState("popularity");
  const [stories] = useState([
    {
      id: 1,
      username: "Sophie M.",
      userImage: "/placeholder-user.png",
      image: "/placeholder-story.png",
      title: "I learned React in 3 weeks!",
      content: "Thanks to this amazing platform...",
      timestamp: "2 hours ago"
    },
    // Plus de stories...
  ]);
  const [currentStory, setCurrentStory] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        // Construction de l'URL avec tous les paramètres de filtrage
        let url = `${API_BASE_URL}/api/skills?`;
        
        // Ajout des paramètres de filtrage
        if (search) url += `query=${encodeURIComponent(search)}&`;
        if (selectedCategories.length > 0) url += `categories=${encodeURIComponent(selectedCategories.join(','))}&`;
        if (selectedLevels.length > 0) url += `levels=${encodeURIComponent(selectedLevels.join(','))}&`;
        if (minRating > 0) url += `minRating=${minRating}&`;
        
        // Ajout du paramètre de tri
        if (sortOption === "popularity") url += "sort=popular";
        else if (sortOption === "rating") url += "sort=rating";
        else if (sortOption === "newest") url += "sort=recent";
        
        console.log("Requesting URL:", url); // Déboguer l'URL
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("API response:", data); // Vérifier la réponse
        
        if (response.ok) {
          setSkills(data.data || []);
        } else {
          console.error("Erreur API:", data.message);
        }
        
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };
    
    fetchSkills();
  }, [search, selectedCategories, selectedLevels, minRating, sortOption]);
  
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

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/placeholder-skill.png';
    return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  };

  // Function to get a small excerpt of a comment
  const getCommentExcerpt = (skill) => {
    if (!skill.ratings || skill.ratings.length === 0) return null;
    // Get the latest rating with a comment
    const ratingWithComment = skill.ratings.find(r => r.comment);
    if (!ratingWithComment) return null;
    
    // Return a short excerpt
    return ratingWithComment.comment.length > 60 
      ? ratingWithComment.comment.substring(0, 60) + '...' 
      : ratingWithComment.comment;
  };

  return (
    <div className="marketplace-container">
      {/* En-tête */}
      <header className="header-section">
        <h1 className="main-title gradient-text">🧠 Skills Marketplace</h1>
        <Link to="/marketplace" className="back-button">
          ← Back to Marketplace
        </Link>
      </header>

      {/* Success Stories */}
      <section className="success-stories-section">
        <h2 className="section-title">✨ Success Stories</h2>
        <div className="stories-container">
          {stories.map(story => (
            <div key={story.id} className="story-card" onClick={() => setCurrentStory(story)}>
              <div className="story-image-container">
                <img src={story.userImage} alt={story.username} />
              </div>
              <h3>{story.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Contenu principal */}
      <div className="main-content-wrapper">
        {/* Filtres */}
        <div className="filters-sidebar">
          <div className="filter-group">
            <h3>📁 Categories</h3>
            {["Développement", "Design", "Marketing", "Business", "Langues", "Musique", "Art", "Science", "Autres"].map(category => (
              <label key={category}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== category));
                    }
                  }}
                />
                {category}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>🎚 Levels</h3>
            {["Débutant", "Intermediate", "Advanced"].map(level => (
              <label key={level}>
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLevels([...selectedLevels, level]);
                    } else {
                      setSelectedLevels(selectedLevels.filter(l => l !== level));
                    }
                  }}
                />
                {level}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>⭐ Rating Minimum</h3>
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
            ⟳ Reset Filters
          </button>
        </div>

        {/* Liste des compétences */}
        <div className="skills-content">
          <div className="search-sort-bar">
            <input
              type="text"
              placeholder="🔍 Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="popularity">Most Popular</option>
              <option value="rating">Best Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <div className="skills-grid">
            {sortedSkills.length > 0 ? (
              sortedSkills.map(skill => (
                <div 
                  key={skill._id} 
                  className="skill-card"
                  onClick={() => navigate(`/skills/${skill._id}`)}
                >
                  <img 
                    src={getImageUrl(skill.imageUrl)} 
                    alt={skill.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-skill.png";
                    }}
                  />
                  <div className="card-content">
                    <h3>{skill.name}</h3>
                    <p>{skill.description}</p>
                    
                    {/* Tags */}
                    {skill.tags && skill.tags.length > 0 && (
                      <div className="tags-container">
                        {skill.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                        {skill.tags.length > 3 && <span className="tag">+{skill.tags.length - 3}</span>}
                      </div>
                    )}
                    
                    <div className="skill-meta">
                      <span className="category">{skill.categories.join(", ")}</span>
                      <span className={`level ${skill.level.toLowerCase()}`}>
                        {skill.level}
                      </span>
                    </div>
                    
                    {/* Preview of a rating comment if available */}
                    {getCommentExcerpt(skill) && (
                      <div className="rating-preview">
                        "{getCommentExcerpt(skill)}"
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
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story Viewer */}
      {currentStory && (
        <div className="story-overlay" onClick={() => setCurrentStory(null)}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <img src={currentStory.image} alt="Story" />
            <div className="story-content">
              <h2>{currentStory.title}</h2>
              <p>{currentStory.content}</p>
              <div className="user-info">
                <img src={currentStory.userImage} alt={currentStory.username} />
                <span>{currentStory.username}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSkills;