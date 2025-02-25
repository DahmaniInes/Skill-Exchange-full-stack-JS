import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaCamera, FaSave, FaTimesCircle, FaUser, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './EditProfile.css';

const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    skills: [],
    profilePicture: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`/api/users/${userId}`);
        const userData = res.data;

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          location: userData.location || '',
          skills: userData.skills || [],
          profilePicture: null
        });

        if (userData.profilePicture) {
          setImagePreview(userData.profilePicture);
        }
      } catch {
        setErrors({ general: 'Error loading data' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Invalid email format";
    if (formData.phone && !formData.phone.match(/^\d+$/)) newErrors.phone = "Phone must contain only numbers";
    if (formData.bio.length > 200) newErrors.bio = "Bio must be under 200 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePicture: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, profilePicture: null }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      await axios.put(`/api/users/${userId}`, data);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => navigate(`/profile/${userId}`), 1500);
    } catch {
      setErrors({ general: 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
      <h1 className="edit-profile-title mb-4 d-flex align-items-center">
  <FaEdit className="me-2" /> Edit Profile
</h1>


        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errors.general && <div className="alert alert-danger">{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          {/* Profile Picture Section */}
          <div className="profile-picture-container text-center mb-3">
            {imagePreview ? (
              <div className="position-relative d-inline-block">
                <img src={imagePreview} alt="Profile" className="profile-picture" />
                <button type="button" className="btn btn-danger btn-sm remove-image-btn" onClick={handleImageRemove}>
                  <FaTimesCircle />
                </button>
              </div>
            ) : (
              <label className="file-input-label">
                <FaCamera className="me-2" /> Upload Image
                <input type="file" accept="image/*" className="d-none" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {/* Input Fields */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label"><FaUser className="me-2" /> First Name</label>
              <input type="text" className="form-control" name="firstName" value={formData.firstName} onChange={handleChange} />
              {errors.firstName && <small className="text-danger">{errors.firstName}</small>}
            </div>
            <div className="col-md-6">
              <label className="form-label"><FaUser className="me-2" /> Last Name</label>
              <input type="text" className="form-control" name="lastName" value={formData.lastName} onChange={handleChange} />
              {errors.lastName && <small className="text-danger">{errors.lastName}</small>}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label"><FaEnvelope className="me-2" /> Email</label>
              <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
              {errors.email && <small className="text-danger">{errors.email}</small>}
            </div>
            <div className="col-md-6">
              <label className="form-label"><FaPhoneAlt className="me-2" /> Phone</label>
              <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
              {errors.phone && <small className="text-danger">{errors.phone}</small>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label"><FaMapMarkerAlt className="me-2" /> Location</label>
            <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Bio</label>
            <textarea className="form-control" name="bio" rows="3" value={formData.bio} onChange={handleChange}></textarea>
            {errors.bio && <small className="text-danger">{errors.bio}</small>}
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/profile/${userId}`)}>
              <FaTimesCircle className="me-2" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FaSave className="me-2" /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
