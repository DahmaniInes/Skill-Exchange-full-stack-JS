import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyCourses.css';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  // Retrieve the user ID from localStorage
  const userId = localStorage.getItem('userid');

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!userId) {
        console.error('User ID not found in localStorage.');
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/courses/user/${userId}`);
        // Transform courses to include progress and completed fields
        const transformedCourses = res.data.map(course => {
          const userData = course.users?.find(u => u.user === userId);
          const progress = userData ? userData.progress || 0 : 0;
          return {
            ...course,
            progress,
            completed: progress === 100
          };
        });
        setCourses(transformedCourses);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        alert('Failed to load your courses. Please try again.');
      }
    };

    fetchUserCourses();
  }, [userId]);

  const filteredCourses = courses.filter(course =>
    (category === 'All' || course.tags.includes(category)) &&
    (course.title && course.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ProgressBar = ({ value }) => {
    let color = value >= 80 ? 'green' : value >= 60 ? 'blue' : 'yellow';
    return (
      <div className="bar-container">
        <div className={`bar-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    );
  };

  return (
    <div className="course-container">
      <h2>Your Enrolled Courses</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="React">React</option>
          <option value="Frontend">Frontend</option>
          <option value="JavaScript">JavaScript</option>
          <option value="DevOps">DevOps</option>
          <option value="Design">Design</option>
        </select>
      </div>

      <div className="course-grid">
        {filteredCourses.map(course => (
          <div key={course._id} className="course-card">
            <div className="course-card-header">
              <img src={course.image || 'https://via.placeholder.com/150'} alt={course.title} />
              <div>
                <h3>{course.title}</h3>
                <p className="category">{course.tags.join(', ') || 'N/A'} • {course.level || 'N/A'}</p>
              </div>
            </div>
            <p className="description">{course.description || 'No description available.'}</p>
            <p className="duration"><strong>Duration:</strong> {course.duration || '30:00'}</p>

            <div className="course-progress">
              <div className="progress-label">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>
              <ProgressBar value={course.progress} />
            </div>

            <p className={course.completed ? 'completed' : 'incomplete'}>
              {course.completed ? '✅ Completed' : '🕒 In Progress'}
            </p>

            <div className="course-actions">
              <button onClick={() => window.location.href = `/course/${course._id}`} className="view-btn">View Course</button>
              <div className="share-btn-container">
                <button className="share-btn">
                  <img src="/images/share.png" alt="Share" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;