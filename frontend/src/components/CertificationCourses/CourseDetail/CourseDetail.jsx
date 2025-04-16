// src/pages/CourseDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CourseDetail.css';

function CourseDetail() {
  const { id } = useParams(); // Get the course ID from the URL
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
        setCourse(res.data); // Set the course state with the fetched data
      } catch (error) {
        console.error('Error fetching course details:', error);
      } finally {
        setLoading(false); // Set loading to false once the fetch is complete
      }
    };

    fetchCourseDetail();
  }, [id]);

  if (loading) return <div>Loading...</div>; // Show loading state
  if (!course) return <div>Course not found</div>; // Handle course not found

  return (
    <div className="course-page">
      {/* Breadcrumb Navigation */}
      <div className="container">
        <div className="breadcrumb">
          <a href="#" className="breadcrumb-link">Office Productivity</a>
          <span className="breadcrumb-separator">›</span>
          <a href="#" className="breadcrumb-link">Other Office Productivity</a>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{course.title}</span>
        </div>

        {/* Main Content */}
        <div className="course-grid">
          {/* Left Column - Course Info */}
          <div className="course-info">
            <h1 className="course-title">{course.title}</h1>
            <p className="course-subtitle">{course.details.fullDescription}</p>

            {/* Course Stats */}
            <div className="course-stats">
              <span className="bestseller-badge">Bestseller</span>
              <div className="rating">
                <span className="rating-score">{course.rating}</span>
                <div className="rating-stars">
                  {[...Array(5)].map((_, index) => (
                    <span key={index} className={`star ${index < Math.floor(course.rating) ? '' : 'half-star'}`}>★</span>
                  ))}
                </div>
                <span className="rating-count">({course.rating} ratings)</span>
              </div>
              <span className="student-count">{course.studentsCount} students</span>
            </div>

            {/* Course Creator */}
            <div className="course-creator">
              <p>
                Created by{" "}
                {course.details.instructors.length > 0 ? (
                  course.details.instructors.map((instructorId, index) => (
                    <span key={instructorId}>
                      {/* Replace this with the actual instructor name fetching logic if needed */}
                      <a href="#" className="creator-link">Instructor {instructorId}</a>
                      {index < course.details.instructors.length - 1 && ', '}
                    </span>
                  ))
                ) : (
                  <span>No instructors available</span>
                )}
              </p>
            </div>

            {/* Course Details */}
            <div className="course-details">
              <div className="detail-item">
                <span>Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span>{course.language || 'English'}</span>
              </div>
              <div className="detail-item">
                <span>{course.subtitles || 'English [CC]'} </span>
                <a href="#" className="more-link">25 more</a>
              </div>
            </div>

            {/* What You'll Learn Section */}
            <div className="learning-section">
              <h2 className="section-title">What you'll learn</h2>
              <div className="learning-grid">
                {course.details.whatYouWillLearn.map((item, index) => (
                  <div className="learning-item" key={index}>
                    <div className="check-icon">✓</div>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Course Preview and Purchase */}
          <div className="course-sidebar">
            <div className="sidebar-card">
              {/* Video Preview */}
              <div className="video-preview">
                <img 
                  src={course.details.videoPath || 'https://via.placeholder.com/600x400'} 
                  alt="Course preview" 
                  className="preview-image" 
                />
                <div className="play-button">
                  <div className="play-icon">▶</div>
                </div>
                <div className="preview-text">Preview this course</div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button className="tab active">Personal</button>
                <button className="tab">Teams</button>
              </div>

              {/* Subscription Info */}
              <div className="sidebar-content">
                <h3 className="subscription-title">Subscribe to Udemy's top courses</h3>
                <p className="subscription-text">
                  Get this course, plus 12,000+ of our top-rated courses, with Personal Plan.{" "}
                  <a href="#" className="learn-more-link">Learn more</a>
                </p>

                {/* CTA Buttons */}
                <button className="btn-primary">Try Personal Plan for free</button>
                <p className="trial-info">
                  Starting at $10.00 per month after trial
                  <br />
                  Cancel anytime
                </p>

                <div className="divider">or</div>

                {/* Price */}
                <div className="price">${course.price}</div>

                <button className="btn-secondary">Add to cart</button>
                <button className="btn-dark">Buy now</button>

                {/* Guarantee */}
                <p className="guarantee">30-Day Money-Back Guarantee</p>
                <p className="access">Full Lifetime Access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
