import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateCourse.css';

const CreateCourse = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);

  const [course, setCourse] = useState({
    title: '',
    image: '',
    description: '',
    price: '',
    rating: '',
    tags: [],
    details: {
      trailerVideoUrl: '',
      videoPath: '',
      whatYouWillLearn: [],
      requirements: [],
      courseIncludes: [],
      exploreRelatedTopics: [],
      contentSections: [{ title: '', videos: [] }],
      fullDescription: '',
      instructors: []
    }
  });

  const [tagInput, setTagInput] = useState('');
  const [instructorInput, setInstructorInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value
      }
    }));
  };

  const handleArrayChange = (field, value, parent = 'details') => {
    setCourse(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value.split('\n').filter(item => item.trim() !== '')
      }
    }));
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...course.details.contentSections];
    if (field === 'videos') {
      updatedSections[index][field] = value.split('\n').filter(v => v.trim() !== '');
    } else {
      updatedSections[index][field] = value;
    }
    setCourse(prev => ({
      ...prev,
      details: {
        ...prev.details,
        contentSections: updatedSections
      }
    }));
  };

  const addSection = () => {
    setCourse(prev => ({
      ...prev,
      details: {
        ...prev.details,
        contentSections: [...prev.details.contentSections, { title: '', videos: [] }]
      }
    }));
  };

  const removeSection = (index) => {
    if (course.details.contentSections.length > 1) {
      const updated = [...course.details.contentSections];
      updated.splice(index, 1);
      setCourse(prev => ({
        ...prev,
        details: {
          ...prev.details,
          contentSections: updated
        }
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setCourse(prev => ({ ...prev, image: file }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const uploadImage = async () => {
    if (!course.image) return null;

    const formData = new FormData();
    formData.append('image', course.image);

    try {
      const response = await axios.post('http://localhost:5000/api/courses/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      setCourse(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    const updated = [...course.tags];
    updated.splice(index, 1);
    setCourse(prev => ({ ...prev, tags: updated }));
  };

  const handleInstructorKeyDown = (e) => {
    if (e.key === 'Enter' && instructorInput.trim() !== '') {
      e.preventDefault();
      setCourse(prev => ({
        ...prev,
        details: {
          ...prev.details,
          instructors: [...prev.details.instructors, instructorInput.trim()]
        }
      }));
      setInstructorInput('');
    }
  };

  const removeInstructor = (index) => {
    const updated = [...course.details.instructors];
    updated.splice(index, 1);
    setCourse(prev => ({
      ...prev,
      details: {
        ...prev.details,
        instructors: updated
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = course.image;
      if (course.image instanceof File) {
        imageUrl = await uploadImage();
      }

      const courseData = {
        ...course,
        image: imageUrl,
        price: parseFloat(course.price),
        rating: course.rating ? parseFloat(course.rating) : 0
      };

      const response = await axios.post('http://localhost:5000/api/courses', courseData);
      navigate(`/courses/${response.data.course._id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-course-page">
      <div className="create-course-container">
        <div className="form-header">
          <h1>Create Your Masterpiece Course</h1>
          <p className="subtitle">Share your knowledge with the world</p>
        </div>
        
        <form onSubmit={handleSubmit} className="create-course-form">
          {/* Basic Information Section */}
          <div className="form-section glassmorphism">
            <h2>
              <span className="section-icon">📝</span>
              Basic Information
            </h2>
            
            <div className="form-group">
              <label>Course Title*</label>
              <input
                name="title"
                value={course.title}
                onChange={handleChange}
                required
                placeholder="e.g. Learn React from Scratch"
                className="styled-input"
              />
            </div>

            <div className="form-group">
              <label>Course Thumbnail*</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div className="image-upload-area" onClick={triggerFileInput}>
                {imagePreview ? (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Course preview" className="image-preview" />
                    <button type="button" className="change-image-btn">
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div className="upload-content">
                    <div className="upload-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5624d0">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <p>Drag & drop your image here or click to browse</p>
                    <p className="hint">Recommended: 1280×720 pixels, JPG/PNG</p>
                  </div>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Description*</label>
              <textarea
                name="description"
                value={course.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe what your course is about"
                className="styled-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price ($)*</label>
                <input
                  type="number"
                  name="price"
                  value={course.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="49.99"
                  className="styled-input"
                />
              </div>
              <div className="form-group">
                <label>Rating (1-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={course.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="4.5"
                  className="styled-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input-container">
                <div className="tags-display">
                  {course.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(index)} className="tag-remove">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type a tag and press Enter"
                  className="tag-input styled-input"
                />
              </div>
            </div>
          </div>

          {/* Course Details Section */}
          <div className="form-section glassmorphism">
            <h2>
              <span className="section-icon">📚</span>
              Course Details
            </h2>

            <div className="form-group">
              <label>Trailer Video URL</label>
              <input
                name="trailerVideoUrl"
                value={course.details.trailerVideoUrl}
                onChange={handleDetailsChange}
                placeholder="https://youtube.com/embed/example"
                className="styled-input"
              />
            </div>

            <div className="form-group">
              <label>What Students Will Learn (one per line)</label>
              <textarea
                value={course.details.whatYouWillLearn.join('\n')}
                onChange={(e) => handleArrayChange('whatYouWillLearn', e.target.value)}
                rows={4}
                placeholder="Students will learn how to...\nStudents will be able to..."
                className="styled-input"
              />
            </div>

            <div className="form-group">
              <label>Requirements (one per line)</label>
              <textarea
                value={course.details.requirements.join('\n')}
                onChange={(e) => handleArrayChange('requirements', e.target.value)}
                rows={3}
                placeholder="Basic knowledge of...\nA computer with..."
                className="styled-input"
              />
            </div>

            <div className="form-group">
              <label>Instructors (enter instructor IDs)</label>
              <div className="tags-input-container">
                <div className="tags-display">
                  {course.details.instructors.map((instructor, index) => (
                    <span key={index} className="tag">
                      {instructor}
                      <button type="button" onClick={() => removeInstructor(index)} className="tag-remove">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={instructorInput}
                  onChange={(e) => setInstructorInput(e.target.value)}
                  onKeyDown={handleInstructorKeyDown}
                  placeholder="Enter instructor ID and press Enter"
                  className="tag-input styled-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Full Description</label>
              <textarea
                name="fullDescription"
                value={course.details.fullDescription}
                onChange={handleDetailsChange}
                rows={6}
                placeholder="Detailed description of your course..."
                className="styled-input"
              />
            </div>
          </div>

          {/* Course Content Section */}
          <div className="form-section glassmorphism">
            <h2>
              <span className="section-icon">🎬</span>
              Course Content
            </h2>
            <p className="section-description">Organize your course into sections and lectures</p>

            {course.details.contentSections.map((section, index) => (
              <div key={index} className="content-section-block">
                <div className="section-header">
                  <h3>Section {index + 1}</h3>
                  {course.details.contentSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="remove-section-btn"
                    >
                      Remove Section
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <input
                    placeholder="Section Title"
                    value={section.title}
                    onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                    required
                    className="styled-input"
                  />
                </div>

                <div className="form-group">
                  <textarea
                    placeholder="Video URLs (one per line)"
                    value={section.videos.join('\n')}
                    onChange={(e) => handleSectionChange(index, 'videos', e.target.value)}
                    rows={3}
                    required
                    className="styled-input"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSection}
              className="add-section-btn"
            >
              + Add Section
            </button>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Course...
                </>
              ) : (
                'Publish Course 🚀'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;