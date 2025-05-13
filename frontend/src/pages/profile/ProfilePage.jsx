import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, MapPin, Globe, Edit3, LockKeyhole,
  Linkedin, Github, Twitter, Briefcase, Bell,
  GraduationCap, Star, FileText,
  ShieldCheck, Activity, CheckCircle2, Layers
} from 'lucide-react';
import ProfileService from '../../services/ProfileService';
import './ProfilePage.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badgeLoading, setBadgeLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const SectionCard = ({ children, title }) => (
    <div className="section-card">
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );

  const TimelineItem = ({ title, subtitle, date, description }) => (
    <div className="timeline-item">
      <div className="timeline-marker"></div>
      <div className="timeline-content">
        <h4>{title}</h4>
        <p className="subtitle">{subtitle}</p>
        <div className="timeline-date">{date}</div>
        {description && <p className="description">{description}</p>}
      </div>
    </div>
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await ProfileService.getUserProfile();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userData || !userData._id) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/badges/${userData._id}`);
        setBadges(response.data);
        console.log("badges : " + response.data);
      } catch (err) {
        console.error('Error fetching badges:', err);
      } finally {
        setBadgeLoading(false);
      }
    };

    fetchBadges();
  }, [userData]);

  const updateField = async (field, value) => {
    try {
      await ProfileService.updateProfile({ [field]: value });
      setUserData(prev => ({ ...prev, [field]: value }));
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;
  if (error) return <div className="error-card">⚠️ Error: {error}</div>;
  if (!userData) return null;

  const {
    _id,
    firstName = 'John',
    lastName = 'Doe',
    email = 'john.doe@example.com',
    phone = '+1 234 567 890',
    profilePicture = '/default-avatar.png',
    bio = 'Professional with extensive experience in digital solutions',
    location = 'New York, USA',
    jobTitle = 'Senior Developer',
    company = 'Tech Corp',
    experience = [],
    education = [],
    socialLinks = {},
    skills = [],
    cv = null,
    averageRating = 4.8,
    xp = 0,
    level = 0,
    ratings = [],
    privacySettings = { isProfilePublic: true },
    notifications = {},
    status = 'online'
  } = userData;

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="avatar-card">
          <div className="avatar-wrapper">
            <img
              src={profilePicture}
              alt={`${firstName} ${lastName}`}
              onError={(e) => {
                console.log("Image error, falling back to default");
                e.target.src = "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg";
              }}
            />
            <div className="rating-badge">
              <Star fill="#FFD700" size={18} />
              <span>{averageRating.toFixed(1)}</span>
            </div>
          </div>
          <div className="header-info">
            <div className="name-container">
              <h1>{firstName} {lastName}</h1>
              <div className="job-container">
                <span className="job-title">{jobTitle}</span>
                <span className="company-name">@{company}</span>
              </div>
              <div className="user-stats">
                <div className="xp-badge">🔥 XP: {xp}</div>
                <div className="level-badge1">🎯 Level: {level}</div>
              </div>
            </div>
            <div className="status-badge">
              <div className={`status-dot ${status}`}></div>
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="action-btn edit-btn"
            onClick={() => navigate('/profileForm')}
          >
            <Edit3 size={14} />
            Edit Profile
          </button>
          <button
            className="action-btn password-btn"
            onClick={() => navigate('/SecuritySettings')}
          >
            <LockKeyhole size={14} />
            Change Password
          </button>
        </div>
      </header>

      <nav className="navigation-cards">
        {['Overview', 'Experience', 'Skills', 'Social', 'Badges', 'Settings'].map((item) => (
          <button
            key={item}
            className={`nav-card ${activeSection === item.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveSection(item.toLowerCase())}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <SectionCard title="Professional Overview">
          <div className="info-grid">
            <div className="info-item">
              <Mail className="info-icon" />
              <div><h5>Email</h5><p>{email}</p></div>
            </div>
            <div className="info-item">
              <Phone className="info-icon" />
              <div><h5>Phone</h5><p>{phone}</p></div>
            </div>
            <div className="info-item">
              <MapPin className="info-icon" />
              <div><h5>Location</h5><p>{location}</p></div>
            </div>
          </div>
          {bio && (
            <div className="bio-card">
              <h4>About Me</h4>
              <p>{bio}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Experience Section */}
      {activeSection === 'experience' && (
        <SectionCard title="Professional Journey">
          <div className="timeline-section">
            <h4>Work Experience</h4>
            {experience.map((exp, index) => (
              <TimelineItem
                key={index}
                title={exp.title}
                subtitle={exp.company}
                date={`${new Date(exp.startDate).toLocaleDateString()} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}`}
                description={exp.description}
              />
            ))}
          </div>
          <div className="timeline-section">
            <h4>Education</h4>
            {education.map((edu, index) => (
              <TimelineItem
                key={index}
                title={edu.degree}
                subtitle={edu.school}
                date={`${new Date(edu.startDate).toLocaleDateString()} - ${edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}`}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Skills Section */}
      {activeSection === 'skills' && (
        <SectionCard title="Core Competencies">
          <div className="skills-grid">
            {skills.map((skill, index) => (
              <div key={index} className="skill-card">
                <div className="skill-header">
                  <h5>{skill.name}</h5>
                  <span className={`skill-level ${skill.level.toLowerCase()}`}>{skill.level}</span>
                </div>
                {skill.description && <p className="skill-description">{skill.description}</p>}
                <div className="skill-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${(skill.yearsOfExperience / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Social Section */}
      {activeSection === 'social' && (
        <SectionCard title="Digital Presence">
          <div className="social-grid">
            {Object.entries(socialLinks).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                className="social-card"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{
                  portfolio: <Globe />,
                  github: <Github />,
                  linkedin: <Linkedin />,
                  twitter: <Twitter />
                }[platform] || <Globe />}
                <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
              </a>
            ))}
          </div>
          {cv && (
            <div className="cv-card">
              <FileText />
              <a href={cv} download>Download Full CV</a>
            </div>
          )}
        </SectionCard>
      )}

      {activeSection === 'badges' && (
  <SectionCard title="Achievement Badges">
    {badgeLoading ? (
      <div className="spinner">Loading badges...</div>
    ) : (
      <div className="badges-grid1">
        {badges.length === 0 ? (
          <p>No badges yet.</p>
        ) : (
          badges.map((badge, index) => (
            <div key={index} className="badge-card1">
              <img
                src={badge.badgeIconUrl || "/default-badge-icon.png"}
                alt={badge.badgeName}
                className="badge-icon"
              />
              <div className="badge-info1">
                <h5>{badge.badgeName}</h5>
                <span className="badge-date">
                  Claimed on: {new Date(badge.claimedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    )}
  </SectionCard>
)}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <SectionCard title="Account Settings">
          <div className="settings-grid">
            <div className="privacy-card">
              <h4>Privacy Settings</h4>
              <div className="setting-item">
                <ShieldCheck />
                <span>Public Profile</span>
                <CheckCircle2 className={privacySettings.isProfilePublic ? 'active' : 'inactive'} />
              </div>
            </div>
            <div className="notifications-card">
              <h4>Notifications</h4>
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="setting-item">
                  <Bell />
                  <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                  <CheckCircle2 className={value ? 'active' : 'inactive'} />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default ProfilePage;
