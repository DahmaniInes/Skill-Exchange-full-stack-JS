import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, MapPin, Globe, Edit3, Award, BookOpen, 
  Linkedin, Github, Twitter, Briefcase, 
  GraduationCap, Star, FileText, Lock, Bell, 
  ShieldCheck, Activity, Settings, CheckCircle2, Layers
} from 'lucide-react';
import ProfileService from '../../services/ProfileService';
import './ProfilePage.css';

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await ProfileService.getUserProfile();
        setUserData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Update profile handler
  const handleUpdateProfile = async (updatedFields) => {
    try {
      setLoading(true);
      const updatedUser = await ProfileService.updateProfile(updatedFields);
      setUserData(prev => ({ ...prev, ...updatedUser }));
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle CV upload
  const handleCVUpload = async (file) => {
    try {
      const result = await ProfileService.uploadCV(file);
      handleUpdateProfile({ cv: result.url });
    } catch (error) {
      setError(error.message);
    }
  };

  // Update privacy settings
  const updatePrivacySettings = async (newSettings) => {
    try {
      await ProfileService.updatePrivacySettings(newSettings);
      setUserData(prev => ({
        ...prev,
        privacySettings: { ...prev.privacySettings, ...newSettings }
      }));
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!userData) return null;

  // Destructure user data with defaults
  const {
    firstName = 'Utilisateur',
    lastName = '',
    email = 'N/A',
    phone = 'Non renseigné',
    profilePicture = '/default-avatar.png',
    bio = 'Aucune bio disponible',
    location = 'Non spécifiée',
    isActive = false,
    jobTitle = 'Poste non renseigné',
    company = 'Entreprise non renseignée',
    experience = [],
    education = [],
    socialLinks = {},
    skills = [],
    cv = null,
    averageRating = 0,
    ratings = [],
    privacySettings = { isProfilePublic: true },
    notifications = {},
    status = 'offline'
  } = userData;

    // Render function for experience and education timeline
    const renderTimeline = (items, type) => (
        <div className="professional-timeline">
            {items.map((item, index) => (
                <div key={index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                        {type === 'experience' ? (
                            <>
                                <h3>{item.title}</h3>
                                <p className="timeline-subtitle">{item.company}</p>
                            </>
                        ) : (
                            <>
                                <h3>{item.degree}</h3>
                                <p className="timeline-subtitle">{item.school}</p>
                            </>
                        )}
                        <div className="timeline-date">
                            {new Date(item.startDate).toLocaleDateString()} - 
                            {item.endDate 
                                ? new Date(item.endDate).toLocaleDateString() 
                                : 'Présent'}
                        </div>
                        {item.description && <p className="timeline-description">{item.description}</p>}
                    </div>
                </div>
            ))}
        </div>
    );

    // Define renderSections object completely
    const renderSections = {
        overview: () => (
            <div className="profile-section-content">
                <div className="info-cards">
                    <div className="info-card">
                        <Mail className="info-card-icon" />
                        <div>
                            <h4>Email</h4>
                            <p>{email}</p>
                        </div>
                    </div>
                    <div className="info-card">
                        <Phone className="info-card-icon" />
                        <div>
                            <h4>Téléphone</h4>
                            <p>{phone}</p>
                        </div>
                    </div>
                    <div className="info-card">
                        <MapPin className="info-card-icon" />
                        <div>
                            <h4>Localisation</h4>
                            <p>{location}</p>
                        </div>
                    </div>
                </div>
                {bio && (
                    <div className="bio-section">
                        <h3>Biographie</h3>
                        <p>{bio}</p>
                    </div>
                )}
            </div>
        ),
        professional: () => (
            <div className="profile-section-content">
                <div className="current-job-card">
                    <div className="job-header">
                        <h3>{jobTitle}</h3>
                        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                            {isActive ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                    <p>{company}</p>
                </div>
                
                {experience.length > 0 && (
                    <div className="timeline-section">
                        <h3>Expérience Professionnelle</h3>
                        {renderTimeline(experience, 'experience')}
                    </div>
                )}
                
                {education.length > 0 && (
                    <div className="timeline-section">
                        <h3>Formation</h3>
                        {renderTimeline(education, 'education')}
                    </div>
                )}
            </div>
        ),
        skills: () => (
            <div className="profile-section-content">
                <div className="skills-grid">
                    {skills.length > 0 ? (
                        skills.map((skill, index) => (
                            <div key={index} className="skill-card">
                                <div className="skill-header">
                                    <span className="skill-name">{skill.name}</span>
                                    <div className="skill-level-indicator">
                                        <div 
                                            className={`skill-level-bar ${skill.level.toLowerCase()}`}
                                            title={skill.level}
                                        >
                                            {skill.level === 'Beginner' && '●'}
                                            {skill.level === 'Intermediate' && '● ●'}
                                            {skill.level === 'Expert' && '● ● ●'}
                                        </div>
                                    </div>
                                </div>
                                {skill.description && (
                                    <p className="skill-description">
                                        {skill.description}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="no-skills-message">
                            <Layers size={32} color="#06BBCC" opacity={0.5} />
                            <p>Aucune compétence renseignée</p>
                        </div>
                    )}
                </div>
            </div>
        ),
        social: () => (
            <div className="profile-section-content">
                <div className="social-links">
                    {Object.entries(socialLinks)
                        .filter(([_, link]) => link)
                        .map(([platform, link]) => {
                            const icons = {
                                portfolio: <Globe />,
                                github: <Github />,
                                linkedin: <Linkedin />,
                                twitter: <Twitter />
                            };
                            return (
                                <a 
                                    key={platform} 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="social-link"
                                >
                                    {icons[platform]}
                                    <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                                </a>
                            );
                        })}
                </div>
                {cv && (
                    <a href={cv} target="_blank" rel="noopener noreferrer" className="cv-download">
                        <FileText />
                        Télécharger mon CV
                    </a>
                )}
            </div>
        ),
        privacy: () => (
            <div className="profile-section-content">
                <div className="privacy-settings">
                    <div className="setting-group">
                        <h3 className="section-title">Paramètres de Confidentialité</h3>
                        <div className="setting-item">
                            <ShieldCheck color="#06BBCC" />
                            <span>Profil Public</span>
                            <CheckCircle2 
                                color={privacySettings.isProfilePublic ? '#06BBCC' : 'gray'}
                            />
                        </div>
                    </div>
                    <div className="setting-group">
                        <h3 className="section-title">Préférences de Notification</h3>
                        {Object.entries(notifications).map(([key, value]) => (
                            <div key={key} className="setting-item">
                                <Bell color="#06BBCC" />
                                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                <CheckCircle2 color={value ? '#06BBCC' : 'gray'} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    };

    // Enhanced navigation sections
    const navigationSections = [
        { key: 'overview', icon: <BookOpen size={16} />, label: 'Aperçu', ariaLabel: 'Voir l\'aperçu du profil' },
        { key: 'professional', icon: <Briefcase size={16} />, label: 'Professionnel', ariaLabel: 'Informations professionnelles' },
        { key: 'skills', icon: <Layers size={16} />, label: 'Compétences', ariaLabel: 'Compétences et domaines d\'expertise' },
        { key: 'social', icon: <Globe size={16} />, label: 'Liens', ariaLabel: 'Liens sociaux et CV' },
        { key: 'privacy', icon: <Lock size={16} />, label: 'Paramètres', ariaLabel: 'Paramètres de confidentialité' }
    ];

    // Enhanced header rendering
    const renderHeader = () => (
        <div className="profile-header">
            <div className="avatar-container">
                <div className="avatar-wrapper">
                    <img 
                        src={profilePicture} 
                        alt={`Avatar de ${firstName} ${lastName}`}
                        className="profile-avatar"
                    />
                    <button 
                        className="edit-avatar-btn" 
                        onClick={() => setIsEditMode(!isEditMode)}
                        aria-label="Modifier le profil"
                    >
                        {isEditMode ? <CheckCircle2 color="#06BBCC" /> : <Edit3 />}
                    </button>
                </div>
            </div>
            <div className="header-info">
                <div className="name-section">
                    <h1>{firstName} {lastName}</h1>
                    {isActive && <span className="verified-badge">Vérifié</span>}
                </div>
                <p className="job-title">{jobTitle} @ {company}</p>
                <div className="profile-stats">
                    <div className="rating">
                        <Star fill="#FFC107" stroke="#FFC107" />
                        <span>{averageRating.toFixed(1)} ({ratings.length} avis)</span>
                    </div>
                    <div className="status-indicator">
                        <Activity />
                        <span className={`status-dot ${status}`}></span>
                        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="professional-profile">
            {renderHeader()}

            <div className="profile-navigation">
                {navigationSections.map(section => (
                    <button 
                        key={section.key}
                        className={`nav-button ${activeSection === section.key ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.key)}
                        aria-label={section.ariaLabel}
                    >
                        {React.cloneElement(section.icon, { 
                            color: activeSection === section.key ? 'white' : '#06BBCC',
                            strokeWidth: activeSection === section.key ? 2 : 1
                        })}
                        {section.label}
                    </button>
                ))}
            </div>

            <div className="profile-content">
                {renderSections[activeSection]()}
            </div>
        </div>
    );
};

export default ProfilePage;