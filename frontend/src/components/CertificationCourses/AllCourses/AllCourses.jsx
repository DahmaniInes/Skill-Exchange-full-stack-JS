import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AllCourses.css';

const AllCourses = () => {
  const [courses, setCourses] = useState([]);
  const [courseQualities, setCourseQualities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [loadingQualities, setLoadingQualities] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Map API segmentation to display values
  const mapQuality = (segmentation) => {
    switch (segmentation) {
      case 'High Quality':
        return 'High';
      case 'Good Quality':
        return 'Medium';
      case 'Low Quality':
        return 'Low';
      default:
        return 'N/A';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all courses
        const res = await axios.get('http://localhost:5000/api/courses');
        const fetchedCourses = res.data;
        setCourses(fetchedCourses);

        // Prepare payload for quality API
        const payload = {
          courses: fetchedCourses.map(course => ({
            'Course Title': course.title.trim(),
            'Rating': course.rating || 0,
            'Duration to complete (Approx.)': course.duration || 20,
            'Number of Review': course.numReviews || 1000,
            'Level': course.level || 'Beginner level'
          }))
        };

        // Call quality API
        const qualityRes = await axios.post('https://e7bb-34-127-62-28.ngrok-free.app/predict', payload);
        const qualityData = qualityRes.data;

        const qualityMap = {};
        qualityData.forEach(item => {
          const normalizedTitle = item['Course Title'].trim().toLowerCase();
          qualityMap[normalizedTitle] = mapQuality(item['Segmentation']);
        });

        setCourseQualities(qualityMap);
        setLoadingQualities(false);
      } catch (err) {
        console.error('Failed to fetch courses or qualities:', err);
        setError('Failed to load course qualities. Displaying courses without quality scores.');
        setLoadingQualities(false);
      }

      try {
        // Fetch leaderboard
        const leaderboardRes = await axios.get('http://localhost:5000/api/leaderboard');
        setLeaderboard(leaderboardRes.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      }
    };

    fetchData();
  }, []);

  const filteredCourses = courses.filter(course =>
    (category === 'All' || course.tags.includes(category)) &&
    (course.title && course.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="all-courses-container">
      <h2>Explore Courses</h2>

      {error && <div className="error-message">{error}</div>}

      {/* 🏆 Leaderboard Section */}
      <div className="leaderboard">
        <h3>🏆 Top Learners</h3>
        {leaderboard.length === 0 ? (
          <p>Loading leaderboard...</p>
        ) : (
          <ul className="leaderboard-list">
            {leaderboard.map((user, index) => (
              <li key={user._id} className="leaderboard-entry">
                <strong>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`} {user.firstName} {user.lastName}
                </strong>{' '}
                ⭐ Level {user.level}, 🧠 {user.xp} XP
              </li>
            ))}
          </ul>
        )}
      </div>

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
              <img
                src={course.image || 'https://via.placeholder.com/150'}
                alt={course.title}
              />
              <span className="level-badge">⭐ {course.rating ? course.rating.toFixed(1) : 'New'}</span>
            </div>
            <h3>{course.title}</h3>
            <p className="desc">{course.description || 'No description available.'}</p>
            <p className="instructor">👨‍🏫 {course.teacher || 'Unknown Instructor'}</p>
            <div className="info">
              <span>📝 Tags: {course.tags.join(', ') || 'N/A'}</span>
              <span className="price">${course.price ? course.price.toFixed(2) : '0.00'}</span>
              <span className="quality">
                Quality:{' '}
                {loadingQualities
                  ? 'Loading...'
                  : courseQualities[course.title.trim().toLowerCase()] || 'N/A'}
              </span>
            </div>
            <div className="actions">
              <button
                className="buy-btn"
                onClick={() => window.location.href = `/course/${course._id}`}
              >
                View Course
              </button>
              <button className="share-btn">Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllCourses;
