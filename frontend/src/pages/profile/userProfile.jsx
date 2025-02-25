import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaEdit, FaCogs } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './EditProfile.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useParams();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/users/${userId}/profile`);
        setUser(res.data);
        setLoading(false);
      } catch (err) {
        setError('Error loading profile');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchUserProfile();
  }, [userId]);
  
  if (loading) return <div className="text-center p-5">Loading profile...</div>;
  if (error) return <div className="text-center p-5 text-danger">{error}</div>;
  if (!user) return <div className="text-center p-5">User not found</div>;
  
  return (
    <div className="container mt-5">
      <div className="card shadow p-4 edit-profile-container">
        <div className="text-center mb-4">
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={`${user.firstName} ${user.lastName}`}
              className="profile-picture"
            />
          ) : (
            <div className="profile-picture bg-light d-flex align-items-center justify-content-center">
              <FaUser className="text-muted" size={50} />
            </div>
          )}
        </div>
        
        <h2 className="text-center text-custom">{user.firstName} {user.lastName}</h2>
        <p className="text-center text-muted"><FaMapMarkerAlt className="me-2" /> {user.location || 'Location not provided'}</p>
        
        <div className="text-center mt-3">
          <Link to={`/profile/edit/${userId}`} className="btn btn-primary me-2">
            <FaEdit className="me-2" /> Edit Profile
          </Link>
          <Link to={`/profile/settings/${userId}`} className="btn btn-secondary">
            <FaCogs className="me-2" /> Settings
          </Link>
        </div>
        
        <div className="mt-4">
          <h4 className="text-custom">About</h4>
          <p>{user.bio || "No biography available."}</p>
        </div>
        
        <div className="mt-4">
          <h4 className="text-custom">Skills</h4>
          {user.skills && user.skills.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <span key={index} className="badge bg-primary p-2">{skill}</span>
              ))}
            </div>
          ) : (
            <p className="text-muted">No skills listed.</p>
          )}
        </div>
        
        <div className="mt-4">
          <h4 className="text-custom">Contact Information</h4>
          <p><FaEnvelope className="me-2" /> {user.email}</p>
          {user.phone && <p><FaPhoneAlt className="me-2" /> {user.phone}</p>}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;