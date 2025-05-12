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
    rating: '0',
    tags: [],
    details: {
      trailerVideoUrl: '',
      videoPath: '',
      whatYouWillLearn: [],
      requirements: [],
      courseIncludes: [],
      exploreRelatedTopics: [],
      sections: [
        {
          section: '',
          lectures: [{ title: '', src: '', duration: '' }]
        }
      ],
      fullDescription: '',
      instructors: ["67f923308a97219d19fec068"]
    }
  });

  const [tagInput, setTagInput] = useState('');

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

  const handleArrayChange = (field, value) => {
    setCourse(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value.split('\n').filter(item => item.trim() !== '')
      }
    }));
  };

  const handleSectionChange = (sectionIndex, field, value) => {
    setCourse(prev => {
      const updatedSections = [...prev.details.sections];
      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], [field]: value };
      return {
        ...prev,
        details: {
          ...prev.details,
          sections: updatedSections
        }
      };
    });
  };

  const handleLectureChange = (sectionIndex, lectureIndex, field, value) => {
    setCourse(prev => {
      const updatedSections = [...prev.details.sections];
      updatedSections[sectionIndex].lectures[lectureIndex] = {
        ...updatedSections[sectionIndex].lectures[lectureIndex],
        [field]: value
      };
      return {
        ...prev,
        details: {
          ...prev.details,
          sections: updatedSections
        }
      };
    });
  };

  const addSection = () => {
    setCourse(prev => ({
      ...prev,
      details: {
        ...prev.details,
        sections: [
          ...prev.details.sections,
          { section: '', lectures: [{ title: '', src: '', duration: '' }] }
        ]
      }
    }));
  };

  const removeSection = (index) => {
    if (course.details.sections.length > 1) {
      setCourse(prev => {
        const updatedSections = prev.details.sections.filter((_, i) => i !== index);
        return {
          ...prev,
          details: {
            ...prev.details,
            sections: updatedSections
          }
        };
      });
    }
  };

  const addLecture = (sectionIndex) => {
    setCourse(prev => {
      const updatedSections = [...prev.details.sections];
      updatedSections[sectionIndex].lectures.push({ title: '', src: '', duration: '' });
      return {
        ...prev,
        details: {
          ...prev.details,
          sections: updatedSections
        }
      };
    });
  };

  const removeLecture = (sectionIndex, lectureIndex) => {
    setCourse(prev => {
      const updatedSections = [...prev.details.sections];
      if (updatedSections[sectionIndex].lectures.length > 1) {
        updatedSections[sectionIndex].lectures = updatedSections[sectionIndex].lectures.filter(
          (_, i) => i !== lectureIndex
        );
      }
      return {
        ...prev,
        details: {
          ...prev.details,
          sections: updatedSections
        }
      };
    });
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
    setCourse(prev => ({
      ...prev,
      tags: [...prev.tags].filter((_, i) => i !== index)
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

      const currentUserId = localStorage.getItem('userid');
      if (!currentUserId) {
        throw new Error('User not logged in. Please log in to create a course.');
      }

      // Log sections for debugging
      console.log('Raw sections:', JSON.stringify(course.details.sections, null, 2));

      // Validate sections
      const sections = course.details.sections || [];
      if (!sections.length) {
        throw new Error('At least one section is required.');
      }

      // Ensure sections have a name and at least one lecture
      const validatedSections = sections
        .map(section => ({
          section: section.section,
          lectures: section.lectures.filter(lecture => 
            lecture.title || lecture.src || lecture.duration
          )
        }))
        .filter(section => section.section && section.lectures.length);

      console.log('Validated sections:', JSON.stringify(validatedSections, null, 2));

      if (!validatedSections.length) {
        throw new Error('At least one section with a valid lecture (title, src, or duration) is required.');
      }

      const courseData = {
        title: course.title,
        image: imageUrl,
        description: course.description,
        price: parseFloat(course.price),
        rating: course.rating ? parseFloat(course.rating) : 0,
        tags: course.tags,
        users: [],
        details: {
          trailerVideoUrl: course.details.trailerVideoUrl,
          videoPath: course.details.videoPath,
          whatYouWillLearn: course.details.whatYouWillLearn,
          requirements: course.details.requirements,
          courseIncludes: course.details.courseIncludes,
          exploreRelatedTopics: course.details.exploreRelatedTopics,
          fullDescription: course.details.fullDescription,
          instructors: course.details.instructors
        }
      };

      console.log('Submitting courseData:', JSON.stringify(courseData, null, 2));

      const courseResponse = await axios.post('http://localhost:5000/api/courses/create', courseData);
      const courseId = courseResponse.data.course._id;

      console.log('Course creation response:', courseResponse.data);

      const contentData = {
        course: courseId,
        sections: validatedSections
      };

      console.log('Submitting contentData:', JSON.stringify(contentData, null, 2));

      const contentResponse = await axios.post('http://localhost:5000/api/course-content', contentData);

      console.log('CourseContent creation response:', contentResponse.data);

      navigate(`/course/${courseId}`);
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
              <label>Video Path</label>
              <input
                name="videoPath"
                value={course.details.videoPath}
                onChange={handleDetailsChange}
                placeholder="/videos/react_intro.mp4"
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
              <label>Course Includes (one per line)</label>
              <textarea
                value={course.details.courseIncludes.join('\n')}
                onChange={(e) => handleArrayChange('courseIncludes', e.target.value)}
                rows={3}
                placeholder="10 hours of video content\nCertificate of completion"
                className="styled-input"
              />
            </div>

            <div className="form-group">
              <label>Explore Related Topics (one per line)</label>
              <textarea
                value={course.details.exploreRelatedTopics.join('\n')}
                onChange={(e) => handleArrayChange('exploreRelatedTopics', e.target.value)}
                rows={3}
                placeholder="JavaScript\nRedux"
                className="styled-input"
              />
            </div>

            <div className="form-group">
              <label>Full Description*</label>
              <textarea
                name="fullDescription"
                value={course.details.fullDescription}
                onChange={handleDetailsChange}
                required
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

            {course.details.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="content-section-block">
                <div className="section-header">
                  <h3>Section {sectionIndex + 1}</h3>
                  {course.details.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(sectionIndex)}
                      className="remove-section-btn"
                    >
                      Remove Section
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Section Title*</label>
                  <input
                    placeholder="e.g. Introduction"
                    value={section.section}
                    onChange={(e) => handleSectionChange(sectionIndex, 'section', e.target.value)}
                    required
                    className="styled-input"
                  />
                </div>

                <div className="form-group">
                  <label>Lectures</label>
                  {section.lectures.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className="lecture-block">
                      <div className="lecture-header">
                        <h4>Lecture {lectureIndex + 1}</h4>
                        {section.lectures.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLecture(sectionIndex, lectureIndex)}
                            className="remove-lecture-btn"
                          >
                            Remove Lecture
                          </button>
                        )}
                      </div>
                      <div className="lecture-fields">
                        <input
                          placeholder="Lecture Title (e.g. Welcome to the Course)"
                          value={lecture.title}
                          onChange={(e) => handleLectureChange(sectionIndex, lectureIndex, 'title', e.target.value)}
                          className="styled-input"
                        />
                        <input
                          placeholder="Video URL (e.g. /videos/intro.mp4)"
                          value={lecture.src}
                          onChange={(e) => handleLectureChange(sectionIndex, lectureIndex, 'src', e.target.value)}
                          className="styled-input"
                        />
                        <input
                          placeholder="Duration (MM:SS, e.g. 5:30)"
                          value={lecture.duration}
                          onChange={(e) => handleLectureChange(sectionIndex, lectureIndex, 'duration', e.target.value)}
                          className="styled-input"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addLecture(sectionIndex)}
                    className="add-lecture-btn"
                  >
                    + Add Lecture
                  </button>
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