import React, { useState, useCallback, useEffect } from "react";
import { 
  FaShieldAlt,
  FaEye, 
  FaEyeSlash, 
  FaCheck, 
  FaTimes, 
  FaLock,
  FaRegCheckCircle,
  FaBell,
  FaExclamationTriangle
} from "react-icons/fa";
import ProfileService from "../../services/ProfileService";
import "./SecuritySettings.css";

// Composant de notification Toast
const Toast = ({ message, type, onClose }) => {
  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
      </div>
      <div className="toast-message">{message}</div>
      <button 
        className="toast-close" 
        onClick={onClose}
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
    </div>
  );
};

const SecuritySettings = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [visibility, setVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [strength, setStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const requirements = [
    { id: 1, text: "Minimum 12 characters", validator: (p) => p.length >= 12 },
    { id: 2, text: "Uppercase and lowercase", validator: (p) => /(?=.*[a-z])(?=.*[A-Z])/.test(p) },
    { id: 3, text: "At least one number", validator: (p) => /\d/.test(p) },
    { id: 4, text: "Special character", validator: (p) => /[!@#$%^&*]/.test(p) }
  ];

  const validateStrength = useCallback((password) => {
    return requirements.filter(req => req.validator(password)).length;
  }, [requirements]);

  const validateForm = (field, value) => {
    const newErrors = { ...errors };
    
    switch(field) {
      case 'newPassword':
        newErrors[field] = value.length < 12 ? 'Minimum 12 characters' : '';
        setStrength(validateStrength(value));
        break;
      case 'confirmPassword':
        newErrors[field] = value !== formData.newPassword ? 'Passwords do not match' : '';
        break;
      default:
        newErrors[field] = value ? '' : 'Field required';
    }
    
    setErrors(newErrors);
  };

  // Fermer le toast après un délai
  useEffect(() => {
    let timer;
    if (toast.show) {
      timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 5000); // Le toast se fermera automatiquement après 5 secondes
    }
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.values(errors).some(error => error) || strength < 3) {
      showToast('Veuillez corriger les erreurs avant de continuer', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setFeedback(null);

      // Validate current password first
      await ProfileService.validatePassword(formData.currentPassword);

      // Update password if validation successful
      await ProfileService.updatePassword(
        formData.currentPassword,
        formData.newPassword
      );

      // Afficher le feedback dans le formulaire
      setFeedback({ 
        type: 'success', 
        message: 'Password updated successfully!' 
      });
      
      // Afficher également un toast de confirmation
      showToast('Mot de passe mis à jour avec succès!', 'success');
      
      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setStrength(0);

    } catch (error) {
      setFeedback({ 
        type: 'error', 
        message: error.message || 'Password update failed' 
      });
      
      // Afficher également un toast d'erreur
      showToast(error.message || 'Échec de la mise à jour du mot de passe', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="security-panel">
      <header className="security-header">
        <FaShieldAlt className="shield-icon" />
        <h1>Account Security</h1>
        <p>Protect your account with a strong password</p>
      </header>

      <form className="security-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword}
            visible={visibility.current}
            error={errors.currentPassword}
            onToggle={() => setVisibility(v => ({ ...v, current: !v.current }))}
            onChange={(value) => {
              setFormData(d => ({ ...d, currentPassword: value }));
              validateForm('currentPassword', value);
            }}
          />
        </div>

        <div className="form-group">
          <PasswordInput
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            visible={visibility.new}
            error={errors.newPassword}
            onToggle={() => setVisibility(v => ({ ...v, new: !v.new }))}
            onChange={(value) => {
              setFormData(d => ({ ...d, newPassword: value }));
              validateForm('newPassword', value);
            }}
          />
          
          <div className="password-requirements">
            {requirements.map(req => (
              <div key={req.id} className={`requirement ${req.validator(formData.newPassword) ? 'valid' : ''}`}>
                <FaRegCheckCircle />
                <span>{req.text}</span>
              </div>
            ))}
            <div className="strength-meter">
              <div 
                className={`strength-bar strength-${strength}`}
                data-strength={['Weak', 'Fair', 'Good', 'Strong'][strength]}
              ></div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            visible={visibility.confirm}
            error={errors.confirmPassword}
            onToggle={() => setVisibility(v => ({ ...v, confirm: !v.confirm }))}
            onChange={(value) => {
              setFormData(d => ({ ...d, confirmPassword: value }));
              validateForm('confirmPassword', value);
            }}
          />
        </div>

        {feedback && (
          <div className={`feedback ${feedback.type}`}>
            {feedback.type === 'error' ? <FaTimes /> : <FaCheck />}
            {feedback.message}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              'Update Password'
            )}
          </button>
          <button 
            type="button" 
            className="btn secondary"
            onClick={() => {
              setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
              });
              setFeedback(null);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
      
      {/* Notification Toast */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
    </div>
  );
};

const PasswordInput = ({ label, name, value, visible, error, onChange, onToggle }) => (
  <div className="password-input">
    <label htmlFor={name}>{label}</label>
    <div className="input-container">
      <FaLock className="input-icon" />
      <input
        id={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'error' : ''}
      />
      <button 
        type="button" 
        className="toggle-btn"
        onClick={onToggle}
        aria-label={`${visible ? 'Hide' : 'Show'} password`}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
    {error && <div className="error-message"><FaTimes /> {error}</div>}
  </div>
);

export default SecuritySettings;