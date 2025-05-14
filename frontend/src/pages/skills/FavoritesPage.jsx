import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './SkillDetailsStyles.css';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les favoris au montage du composant
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          throw new Error('Vous devez être connecté pour voir vos favoris.');
        }

        const response = await axios.get('http://localhost:5000/api/users/bookmarks', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Récupérer les détails des compétences à partir des IDs
        const skillIds = response.data.bookmarks;
        const skillsPromises = skillIds.map((skillId) =>
          axios.get(`http://localhost:5000/api/skills/${skillId}`)
        );
        const skillsResponses = await Promise.all(skillsPromises);
        const skills = skillsResponses.map((res) => res.data.data);

        setFavorites(skills);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des favoris.');
        toast.error(err.message || 'Erreur lors du chargement des favoris.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // Supprimer un favori
  const removeFavorite = async (skillId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.delete('http://localhost:5000/api/skills/bookmarks', {
        headers: { Authorization: `Bearer ${token}` },
        data: { skillId },
      });

      setFavorites(favorites.filter((skill) => skill._id !== skillId));
      toast.success('Compétence retirée des favoris.');
    } catch (err) {
      toast.error('Erreur lors de la suppression du favori.');
    }
  };

  if (loading) {
    return <div className="favorites-loading">Chargement des favoris...</div>;
  }

  if (error) {
    return <div className="favorites-error">{error}</div>;
  }

  return (
    <div className="favorites-page">
      <h1>Mes Compétences Favorites</h1>
      {favorites.length === 0 ? (
        <p className="no-favorites">Vous n'avez pas encore de favoris.</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((skill) => (
            <div key={skill._id} className="favorite-card">
              <img
                src={skill.imageUrl ? `http://localhost:5000${skill.imageUrl}` : '/placeholder-skill.png'}
                alt={skill.name}
                className="favorite-image"
              />
              <div className="favorite-content">
                <h2>{skill.name}</h2>
                <p>{skill.description?.substring(0, 100)}...</p>
                <div className="favorite-categories">
                  {skill.categories?.map((category, index) => (
                    <span key={index} className="category-tag">
                      {category}
                    </span>
                  ))}
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeFavorite(skill._id)}
                >
                  Retirer des favoris
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;