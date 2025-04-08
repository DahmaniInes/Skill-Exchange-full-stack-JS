import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

// Create a base axios instance with common configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
});

// Add request interceptor to automatically add the token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

const CreateRoadmapPage = () => {
  const [searchParams] = useSearchParams();
  const skillId = searchParams.get("skillId");
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    goals: ["Master the basics"],
    timeframe: 3,
    preferences: {
      learningStyle: "Self-paced",
      availability: 10
    }
  });
  
  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.warning("Please log in to create a roadmap");
      navigate('/login', { state: { returnUrl: window.location.pathname + window.location.search } });
    }
  }, [navigate]);
  
  // Fetch skill data
 // Updated fetchSkill useEffect
useEffect(() => {
    const fetchSkill = async () => {
        try {
          const response = await api.get(`/api/skills/${skillId}`);
          
          if (response.data?.success && response.data.skill) {
            setSkill(response.data.skill);
          } else {
            throw new Error('Compétence non trouvée');
          }
        } catch (err) {
          if (err.response?.status === 404) {
            navigate('/skills', { state: { error: 'Compétence introuvable' } });
          }
      } finally {
        setLoading(false);
      }
    };
  
    if (skillId) fetchSkill();
  }, [skillId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "timeframe") {
      setFormData({
        ...formData,
        timeframe: parseInt(value) || 1 // Default to 1 if invalid
      });
    } else if (name === "availability") {
      setFormData({
        ...formData,
        preferences: { 
          ...formData.preferences, 
          availability: parseInt(value) || 5 // Default to 5 if invalid
        }
      });
    } else if (name === "goals") {
      const goalsArray = value.split(',')
        .map(goal => goal.trim())
        .filter(goal => goal.length > 0);
        
      setFormData({
        ...formData,
        goals: goalsArray.length > 0 ? goalsArray : ["Master the basics"]
      });
    } else if (name === "learningStyle") {
      setFormData({
        ...formData,
        preferences: { ...formData.preferences, learningStyle: value }
      });
    }
  };
  const handleGenerateRoadmap = async () => {
    setLoading(true);
    try {
      // Vérification complète des données de la compétence
      if (!skill || !skill._id || !skill.level || !skill.category) {
        throw new Error('Informations de la compétence incomplètes');
      }
  
      // Construction du payload avec vérification
      const payload = {
        skill: {
          id: skill._id,
          name: skill.name || 'Compétence sans nom',
          level: skill.level || 'Débutant',
          category: skill.category || 'Général'
        },
        goals: formData.goals,
        timeframe: formData.timeframe,
        preferences: formData.preferences
      };
      
      // Ajout de logs détaillés
      console.log('Payload envoyé:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/api/roadmaps/generate', payload);
      console.log('Réponse API complète:', response.data);
      
      // Gestion des réponses vides
      if (!response.data?.roadmap) {
        throw new Error('Réponse serveur invalide');
      }
      
      // Vérification de l'ID avant redirection
      if (response.data.roadmap?._id) {
        console.log('Redirection vers:', `/roadmap/${response.data.roadmap._id}`);
        navigate(`/roadmap/${response.data.roadmap._id}`);
      } else {
        throw new Error('ID de roadmap manquant dans la réponse');
      }
    } catch (err) {
      console.error('Erreur complète:', err);
      
      // Afficher l'erreur à l'utilisateur
      setError(err.message || 'Erreur lors de la génération du roadmap');
      toast.error(err.message || 'Erreur lors de la génération du roadmap');
      
      // Gestion centralisée des erreurs
      if (err.message.includes('compétence')) {
        toast.error('Veuillez sélectionner une compétence valide');
        navigate('/skills');
      }
      
      // Auto-réauthentification si nécessaire
      if (err.response?.status === 401) {
        localStorage.removeItem('jwtToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  if (loading && !skill) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Create Learning Roadmap</h1>
        
        {skill && (
          <div className="mb-6">
            <p className="text-lg mb-2">
              Create a personalized learning roadmap for:
            </p>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
              {skill.imageUrl && (
                <img 
                  src={skill.imageUrl} 
                  alt={skill.name} 
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-skill.png'; // Fallback image
                  }}
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{skill.name}</h2>
                <p className="text-gray-600">{skill.description}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goals (comma separated)
            </label>
            <input
              type="text"
              name="goals"
              className="w-full p-2 border rounded-md"
              placeholder="Master basics, Build portfolio project, etc."
              defaultValue={formData.goals.join(", ")}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe (months)
            </label>
            <input
              type="number"
              name="timeframe"
              className="w-full p-2 border rounded-md"
              min="1"
              max="12"
              value={formData.timeframe}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Style
            </label>
            <select
              name="learningStyle"
              className="w-full p-2 border rounded-md"
              value={formData.preferences.learningStyle}
              onChange={handleInputChange}
            >
              <option value="Self-paced">Self-paced</option>
              <option value="Structured">Structured</option>
              <option value="Project-based">Project-based</option>
              <option value="Visual">Visual learner</option>
              <option value="Hands-on">Hands-on</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Hours per Week
            </label>
            <input
              type="number"
              name="availability"
              className="w-full p-2 border rounded-md"
              min="1"
              max="40"
              value={formData.preferences.availability}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <p>
            We'll create a step-by-step roadmap to help you learn this skill efficiently.
            Your personalized roadmap will include:
          </p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>Sequential learning steps adapted to your level</li>
            <li>Estimated time for completion</li>
            <li>Recommended resources for each step</li>
            <li>Progress tracking tools</li>
          </ul>
          
          <button
            className={`w-full py-3 rounded-md transition-colors ${
              loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={handleGenerateRoadmap}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Roadmap...
              </span>
            ) : (
              "Generate My Roadmap"
            )}
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRoadmapPage;