import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AllCourses.css';

const AllCourses = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/courses'); // Update URL if necessary
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    (category === 'All' || course.tags.includes(category)) &&
    (course.title && course.title.toLowerCase().includes(searchTerm.toLowerCase())) // Check if title is defined
  );

  const handleEnroll = async (courseId) => {
    const userId = localStorage.getItem("userid");
    try {
      const res = await axios.post('http://localhost:5000/api/courses/enroll', { userId, courseId });
      alert(`Successfully enrolled in ${res.data.title}`);
      // Optionally, you may want to update the courses state to reflect the change
    } catch (err) {
      console.error('Failed to enroll in the course:', err);
      alert('Enrollment failed. Please try again.');
    }
  };

  return (
    <div className="all-courses-container">
      <h2>Explore Courses</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Web">Web</option>
          <option value="DevOps">DevOps</option>
          <option value="Design">Design</option>
        </select>
      </div>

      <div className="course-grid">
        {filteredCourses.map(course => (
          <div key={course._id} className="course-card">
            <div className="course-header">
              <img src={course.image || 'https://via.placeholder.com/150'} alt={course.title} />
              <span className={`level-badge`}>⭐ {course.rating ? course.rating : 'New'}</span>
            </div>
            <h3>{course.title}</h3>
            <p className="desc">{course.description || 'No description available.'}</p>
            <p className="instructor">👨‍🏫 {course.teacher || 'Unknown Instructor'}</p>
            <div className="info">
              <span>📝 Tags: {course.tags.join(', ') || 'N/A'}</span>
              <span className="price">${course.price || '0.00'}</span>
            </div>
            <div className="actions">
              <button className="buy-btn" onClick={() => handleEnroll(course._id)}>Buy Now</button>
              <button className="share-btn">Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllCourses;
