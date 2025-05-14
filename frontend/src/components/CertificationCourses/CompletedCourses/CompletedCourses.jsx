import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CompletedCourses.css';

const CompletedCourses = () => {
  const [completedCourses, setCompletedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompletedCourses = async () => {
      try {
        const userId = localStorage.getItem('userid');
        if (!userId) {
          throw new Error('User not logged in. Please log in to view completed courses.');
        }

        const response = await axios.get(`http://localhost:5000/api/courses/user/${userId}`);
        const courses = response.data;

        console.log('Fetched courses:', JSON.stringify(courses, null, 2));

        const completed = courses.filter(course => {
          const userProgress = course.users?.find(u => u.user === userId)?.progress || 0;
          return userProgress === 100;
        });

        setCompletedCourses(completed);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching completed courses:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchCompletedCourses();
  }, []);

  const openReviewModal = (courseId) => {
    setSelectedCourseId(courseId);
    setReviewRating(0);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedCourseId(null);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userid');
      if (!userId) {
        throw new Error('User not logged in.');
      }

      if (reviewRating < 1 || reviewRating > 5) {
        alert('Please select a rating between 1 and 5 stars.');
        return;
      }

      await axios.post('http://localhost:5000/api/reviews', {
        course: selectedCourseId,
        user: userId,
        rating: reviewRating,
        comment: reviewComment
      });

      alert('Review submitted successfully!');
      closeReviewModal();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleGetCertificate = async (course) => {
    try {
      const userId = localStorage.getItem('userid');
      if (!userId) {
        throw new Error('User not logged in.');
      }

      console.log('Course data for certificate:', JSON.stringify(course, null, 2));

      let userName = 'John Doe';
      try {
        const userResponse = await axios.get(`http://localhost:5000/api/users/${userId}`);
        userName = userResponse.data.name || userName;
      } catch (err) {
        console.warn('Failed to fetch user name:', err);
      }

      let instructorName = 'Course Instructor';
      try {
        const instructorId = course.details?.instructors?.[0];
        if (instructorId) {
          const instructorResponse = await axios.get(`http://localhost:5000/api/instructors/${instructorId}`);
          instructorName = instructorResponse.data.name || instructorName;
        }
      } catch (err) {
        console.warn('Failed to fetch instructor name:', err);
      }

      const payload = {
        courseName: course.title,
        userName,
        instructorName,
        courseDetails: course.details?.fullDescription || course.description || 'No description available'
      };

      console.log('Generating certificate with payload:', payload);

      const response = await axios.post('http://localhost:5000/api/certification/generate-certificate', payload, {
        responseType: 'blob'
      });

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      // Optional: Trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${course.title}_certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(pdfUrl);
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Failed to generate certificate: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStarClick = (rating) => {
    setReviewRating(rating);
  };

  if (isLoading) {
    return <div className="loading">Loading completed courses...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="completed-courses-page">
      <h1 className="page-title">Your Completed Courses</h1>
      {completedCourses.length === 0 ? (
        <p className="no-courses">You haven't completed any courses yet.</p>
      ) : (
        <div className="courses-grid">
          {completedCourses.map(course => (
            <div key={course._id} className="course-card">
              <img src={course.image} alt={course.title} className="course-image" />
              <div className="course-content">
                <h2 className="course-title">{course.title}</h2>
                <p className="course-description">{course.description}</p>
                <div className="course-actions">
                  <button
                    className="action-btn review-btn"
                    onClick={() => openReviewModal(course._id)}
                  >
                    Add Review
                  </button>
                  <button
                    className="action-btn certificate-btn"
                    onClick={() => handleGetCertificate(course)}
                  >
                    Get Certification
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewModalOpen && (
        <div className="review-modal">
          <div className="review-modal-content">
            <button className="close-modal-btn" onClick={closeReviewModal}>
              ×
            </button>
            <h2>Add Your Review</h2>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="rating-section">
                <label>Rating:</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star ${reviewRating >= star ? 'filled' : ''}`}
                      onClick={() => handleStarClick(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="comment-section">
                <label>Comment:</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about the course..."
                  rows="5"
                  className="comment-input"
                />
              </div>
              <button type="submit" className="submit-review-btn">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedCourses;