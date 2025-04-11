import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';

// Création du contexte
const AuthContext = createContext();

/**
 * Fournisseur d'authentification qui gère l'état de connexion
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Vérifie l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Optionnel: Vérifier la validité du token avec le backend
          const { data } = await axios.get('/api/auth/verify');
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [token]);

  /**
   * Connecte l'utilisateur et stocke le token
   */
  const login = async (credentials) => {
    try {
      const { data } = await axios.post('/api/auth/login', credentials);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      navigate('/admin/dashboard');
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  /**
   * Déconnecte l'utilisateur
   */
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  /**
   * Enregistre un nouvel utilisateur
   */
  const register = async (userData) => {
    try {
      const { data } = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      navigate('/admin/dashboard');
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  // Valeur fournie par le contexte
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};