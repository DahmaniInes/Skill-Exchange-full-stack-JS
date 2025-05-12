import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Confetti from 'react-confetti';
import './LearnPage.css';

const LearnPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseContent, setCourseContent] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [completedLectures, setCompletedLectures] = useState([]);
  const [expandedSections, setExpandedSections] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        const contentResponse = await axios.get(`http://localhost:5000/api/course-content/${courseId}`);
        const sections = contentResponse.data.sections || [];
        setCourseContent(sections);

        if (sections && sections.length > 0 && sections[0].lectures.length > 0) {
          setCurrentLecture(sections[0].lectures[0]);
        }
        setExpandedSections(sections.map((_, index) => index));

        const userId = localStorage.getItem('userid');
        if (!userId) {
          console.warn('User ID not found in localStorage');
          return;
        }

        const courseResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        const courseData = courseResponse.data;

        const userProgress = courseData.users?.find((u) => u.user === userId)?.progress || 0;

        const totalLectures = sections.reduce((acc, section) => acc + section.lectures.length, 0);
        const completedCount = Math.round((userProgress / 100) * totalLectures);

        const lectureIds = [];
        let count = 0;
        for (const section of sections) {
          for (const lecture of section.lectures) {
            if (count < completedCount) {
              lectureIds.push(lecture._id);
              count++;
            } else {
              break;
            }
          }
          if (count >= completedCount) break;
        }

        setCompletedLectures(lectureIds);
        console.log(`Initialized completedLectures with ${completedCount} lectures based on ${userProgress}% progress`);
      } catch (error) {
        console.error('Error fetching course data:', error);
        alert('Failed to load course content. Please try again.');
      }
    };

    fetchCourseContent();
  }, [courseId]);

  const toggleSection = (index) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const selectLecture = (lecture) => {
    setCurrentLecture(lecture);
  };

  const markAsCompleted = async (lectureId) => {
    if (!completedLectures.includes(lectureId)) {
      try {
        const newCompletedLectures = [...completedLectures, lectureId];
        setCompletedLectures(newCompletedLectures);

        const totalLectures = courseContent.reduce((acc, section) => acc + section.lectures.length, 0);
        const progress = totalLectures === 0 ? 0 : (newCompletedLectures.length / totalLectures) * 100;

        const userId = localStorage.getItem('userid');
        if (!userId) {
          throw new Error('User ID not found in localStorage');
        }

        await axios.put(`http://localhost:5000/api/courses/progress/${courseId}`, {
          courseId,
          userId,
          progress: Math.round(progress)
        });

        console.log(`Progress updated: ${progress}% for course ${courseId}`);
      } catch (error) {
        console.error('Error updating progress:', error);
        alert('Failed to mark lecture as completed. Please try again.');
        setCompletedLectures(completedLectures);
      }
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleGetCertificate = () => {
    navigate(`/CompletedCourses`);
  };

  const totalLectures = courseContent.reduce((acc, section) => acc + section.lectures.length, 0);
  const progress = totalLectures === 0 ? 0 : (completedLectures.length / totalLectures) * 100;

  if (!currentLecture) {
    return <div>Loading course content...</div>;
  }

  return (
    <div className="learn-page">
      {progress === 100 && (
        <div className="congratulation-modal">
          <Confetti width={window.innerWidth} height={window.innerHeight} />
          <div className="congratulation-content">
            <h2>Congratulations!</h2>
            <p>You have completed the course!</p>
            <button className="certificate-btn" onClick={handleGetCertificate}>
              Get Certification
            </button>
          </div>
        </div>
      )}

      <header className="header">
        <h1 className="course-title">Full Stack Development Masterclass</h1>
        <div className="progress-container">
          <span className="progress-text">Progress: {Math.round(progress)}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="video-notes-section">
          <div className="video-container">
            <video
              src={currentLecture.src}
              controls
              autoPlay
              className="video-player"
            />
            <div className="video-info">
              <h2 className="lecture-title">Lecture: {currentLecture.title}</h2>
              <p className="lecture-duration">Duration: {currentLecture.duration}</p>
              <button
                onClick={() => markAsCompleted(currentLecture._id)}
                className={`complete-btn ${completedLectures.includes(currentLecture._id) ? 'completed' : ''}`}
                disabled={completedLectures.includes(currentLecture._id)}
              >
                {completedLectures.includes(currentLecture._id) ? 'Completed' : 'Mark as Completed'}
              </button>
            </div>
          </div>

          <div className="notes-section">
            <h3 className="notes-title">Your Notes</h3>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              className="notes-input"
              rows="5"
              placeholder="Write your notes here..."
            />
            <button
              onClick={() => alert('Notes saved!')}
              className="save-notes-btn"
            >
              Save Notes
            </button>
          </div>
        </div>

        <aside className="sidebar">
          <h3 className="sidebar-title">Course Content</h3>
          <div className="course-content">
            {courseContent.map((section, index) => (
              <div key={index} className="section">
                <div
                  className="section-header"
                  onClick={() => toggleSection(index)}
                >
                  <h4 className="section-title">{section.section}</h4>
                  <span className="section-toggle">{expandedSections.includes(index) ? '▲' : '▼'}</span>
                </div>
                {expandedSections.includes(index) && (
                  <ul className="lecture-list">
                    {section.lectures.map((lecture) => (
                      <li
                        key={lecture._id}
                        className={`lecture-item ${currentLecture._id === lecture._id ? 'active' : ''}`}
                        onClick={() => selectLecture(lecture)}
                      >
                        <span className="lecture-title">{lecture.title}</span>
                        <div className="lecture-meta">
                          <span className="lecture-duration">{lecture.duration}</span>
                          {completedLectures.includes(lecture._id) && (
                            <svg
                              className="completed-icon"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LearnPage;