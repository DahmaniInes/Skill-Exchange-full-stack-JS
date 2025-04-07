import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Bell, 
  Lock, 
  Shield, 
  Zap, 
  Globe, 
  Layers, 
  User, 
  MessageCircle,
  Briefcase,
  Code,
  Cpu,
  Radio
} from "lucide-react";
import "./PersonalInfoPage.css";
import ProfileService from "../../services/ProfileService";

// Composant de section de paramètres avancés
const SettingsSection = ({ 
  icon, 
  title, 
  description, 
  children,
  onActivate
}) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={`settings-section ${isActive ? 'active' : ''}`}>
      <div 
        className="settings-section-header"
        onClick={() => {
          setIsActive(!isActive);
          onActivate && onActivate(!isActive);
        }}
      >
        <div className="settings-section-icon">
          {React.cloneElement(icon, { 
            size: 24, 
            color: isActive ? "#06BBCC" : "#718096" 
          })}
        </div>
        <div className="settings-section-info">
          <h4 className="settings-section-title">{title}</h4>
          <p className="settings-section-description">{description}</p>
        </div>
        <div className="settings-section-indicator">
          <span className={`indicator ${isActive ? 'active' : ''}`}></span>
        </div>
      </div>
      
      {isActive && (
        <div className="settings-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

// Composant de paramètre individuel
const SettingItem = ({ 
  icon, 
  label, 
  description, 
  checked, 
  onChange,
  advanced = false
}) => {
  const [localChecked, setLocalChecked] = useState(checked);

  useEffect(() => {
    onChange(localChecked);
  }, [localChecked]);

  return (
    <div className="setting-item">
      <div className="setting-item-header">
        <div className="setting-item-icon">
          {React.cloneElement(icon, { 
            size: 20, 
            color: localChecked ? "#06BBCC" : "#718096" 
          })}
        </div>
        <div className="setting-item-details">
          <h5 className="setting-item-label">{label}</h5>
          <p className="setting-item-description">{description}</p>
        </div>
        <div className="setting-item-control">
          <label className="smart-toggle">
            <input
              type="checkbox"
              checked={localChecked}
              onChange={(e) => setLocalChecked(e.target.checked)}
            />
            <span className="smart-toggle-slider"></span>
          </label>
          {advanced && (
            <div className="advanced-indicator" title="Advanced Setting">
              <Layers size={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdvancedSettingsPage = ({ 
    formData, 
    handleChange,
    prevStep 
  }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const handleSubmit = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Envoi des paramètres de confidentialité
        await ProfileService.updatePrivacySettings({
          profileVisibility: formData.privacySettings.isProfilePublic,
          contactInfoVisibility: formData.privacySettings.isDiscoverable
        });
  
        // Envoi des préférences de notifications
        await ProfileService.updateNotificationPreferences({
          email: formData.notifications.emailNotifications,
          push: formData.notifications.pushNotifications,
          skillOpportunities: formData.notifications.skillRequests
        });
  
        // Mise à jour du statut
        await ProfileService.updateProfile({ status: formData.status });
  
        alert('Paramètres sauvegardés avec succès!');
      } catch (error) {
        setError(error.message || 'Erreur lors de la sauvegarde');
      } finally {
        setLoading(false);
      }
    };
  
    const updateNestedSetting = (section, key, value) => {
      handleChange({
        ...formData,
        [section]: {
          ...formData[section],
          [key]: value
        }
      });
    };
  
    return (
      <section className="personal-info-section advanced-settings">
        <h3 className="section-title">
          <Settings size={24} className="section-title-icon" />
          Paramètres avancés
        </h3>
  
        {error && <div className="error-banner">{error}</div>}
  
        <div className="settings-container">
          <SettingsSection
            icon={<Lock />}
            title="Confidentialité & Sécurité"
            description="Contrôlez la visibilité de vos données"
          >
            <SettingItem
              icon={<Globe />}
              label="Profil public"
              description="Rendre votre profil visible à tous"
              checked={formData.privacySettings.isProfilePublic}
              onChange={(value) => updateNestedSetting('privacySettings', 'isProfilePublic', value)}
              advanced
            />
            <SettingItem
              icon={<Shield />}
              label="Découvrabilité"
              description="Apparaître dans les résultats de recherche"
              checked={formData.privacySettings.isDiscoverable}
              onChange={(value) => updateNestedSetting('privacySettings', 'isDiscoverable', value)}
            />
          </SettingsSection>
  
          <SettingsSection
            icon={<Bell />}
            title="Notifications"
            description="Gérez vos préférences de notifications"
          >
            <SettingItem
              icon={<MessageCircle />}
              label="Notifications email"
              description="Recevoir des mises à jour par email"
              checked={formData.notifications.emailNotifications}
              onChange={(value) => updateNestedSetting('notifications', 'emailNotifications', value)}
            />
            <SettingItem
              icon={<Zap />}
              label="Notifications push"
              description="Alertes instantanées sur vos appareils"
              checked={formData.notifications.pushNotifications}
              onChange={(value) => updateNestedSetting('notifications', 'pushNotifications', value)}
              advanced
            />
            <SettingItem
              icon={<Briefcase />}
              label="Opportunités"
              description="Nouvelles offres en rapport avec vos compétences"
              checked={formData.notifications.skillRequests}
              onChange={(value) => updateNestedSetting('notifications', 'skillRequests', value)}
            />
          </SettingsSection>
  
          <SettingsSection
            icon={<Radio />}
            title="Disponibilité"
            description="Définissez votre statut actuel"
          >
            <div className="status-select-advanced">
              <label className="form-label">Statut actuel</label>
              <select 
                className="status-select"
                value={formData.status}
                onChange={(e) => handleChange({ ...formData, status: e.target.value })}
              >
                <option value="online">🟢 Disponible</option>
                <option value="away">🟡 Absent</option>
                <option value="busy">🔴 Occupé</option>
                <option value="offline">⚫ Hors ligne</option>
              </select>
            </div>
          </SettingsSection>
        </div>
  
        <div className="navigation-container">
          <div className="buttons-container">
            <button 
              className="button button-secondary"
              onClick={prevStep}
              disabled={loading}
            >
              Retour
            </button>
            <button 
              className="button button-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Sauvegarder'
              )}
            </button>
          </div>
        </div>
      </section>
    );
  };
  
  export default AdvancedSettingsPage;