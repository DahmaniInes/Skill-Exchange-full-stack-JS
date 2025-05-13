import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [courseContent, setCourseContent] = useState(null);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [completedLectures, setCompletedLectures] = useState([]);
  const reviewsPerPage = 5;

  const currentUserId = localStorage.getItem('userid');
  const isEnrolled = course?.users?.some(u => u.user === currentUserId);

  console.log('currentUserId:', currentUserId);
  console.log('course.users:', course?.users);
  console.log('isEnrolled:', isEnrolled);

  const totalLectures = courseContent?.sections?.reduce((acc, section) => acc + (section.lectures?.length || 0), 0) || 0;
  const progress = totalLectures ? (completedLectures.length / totalLectures) * 100 : 0;
  const navigate = useNavigate();

  const handleEnroll = async (courseId) => {
    try {
      const userId = localStorage.getItem('userid');
      const res = await axios.post('http://localhost:5000/api/courses/enroll', { userId, courseId });
      alert(`Successfully enrolled in ${res.data.title}`);
      const updatedRes = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
      setCourse(updatedRes.data);
    } catch (err) {
      console.error('Failed to enroll in the course:', err);
      alert('Enrollment failed. Please try again.');
    }
  };

  const handleStartLearning = () => {
    navigate(`/learn/${id}`);
  };

  const toggleSection = (index) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const markAsCompleted = async (lectureId) => {
    if (!completedLectures.includes(lectureId)) {
      try {
        await axios.post(`http://localhost:5000/api/courses/${id}/lectures/${lectureId}/complete`, { userId: currentUserId });
        setCompletedLectures([...completedLectures, lectureId]);
      } catch (err) {
        console.error('Failed to mark lecture as completed:', err);
        alert('Failed to mark lecture as completed.');
      }
    }
  };

  const loadMoreReviews = () => {
    setReviewPage((prev) => prev + 1);
  };

  const shareCourse = (platform) => {
    const url = window.location.href;
    const text = `Check out this course: ${course.title}`;
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch course details
        const courseRes = await axios.get(`http://localhost:5000/api/courses/${id}`);
        setCourse(courseRes.data);

        // Fetch course content
        const contentRes = await axios.get(`http://localhost:5000/api/course-content/${id}`);
        const sections = contentRes.data.sections || [];
        setCourseContent(contentRes.data);

        // Initialize completed lectures based on user progress
        if (courseRes.data.users?.some(u => u.user === currentUserId)) {
          const userProgress = courseRes.data.users.find(u => u.user === currentUserId)?.progress || 0;
          const totalLectures = sections.reduce((acc, section) => acc + (section.lectures?.length || 0), 0);
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
        }

        // Fetch instructor details
        if (courseRes.data.details?.instructors?.[0]) {
          const instructorRes = await axios.get(`http://localhost:5000/api/instructors/${courseRes.data.details.instructors[0]}`);
          setInstructor(Array.isArray(instructorRes.data) ? instructorRes.data[0] : instructorRes.data);
          console.log(instructorRes.data);
          console.log("instructorRes.data");
        }

        // Fetch reviews
        const reviewsRes = await axios.get(`http://localhost:5000/api/reviews/course/${id}`);
        setReviews(reviewsRes.data);

        // Fetch all courses for recommendations
        const allCoursesRes = await axios.get('http://localhost:5000/api/courses');
        const allCourses = allCoursesRes.data;

        // Fetch recommended courses
        const payload = {
          course_title: courseRes.data.title,
          courses: allCourses.map(course => ({
            'Course Title': course.title,
            'Offered By': course.offeredBy || 'Unknown',
            'Skill gain': course.tags || 'General Skills'
          })),
          features: allCourses.map(course => course.features || [1, 0, 0])
        };

        console.log('Recommendation payload:', JSON.stringify(payload, null, 2));

        const recommendRes = await axios.post('https://ac82-34-125-80-119.ngrok-free.app/recommend', payload);
        const recommendedCourses = recommendRes.data.map(recCourse => {
          const matchingCourse = allCourses.find(c => c.title === recCourse['Course Title']);
          return {
            id: matchingCourse?._id || '',
            title: recCourse['Course Title'],
            description: matchingCourse?.description || recCourse['Skill gain'] || 'No description available',
            image: matchingCourse?.image || '/placeholder.jpg',
            price: matchingCourse?.price || 49.99
          };
        });

        console.log('Recommended courses:', recommendedCourses.map(c => c.title));

        setRelatedCourses(recommendedCourses);
      } catch (err) {
        //console.error('Error fetching course data:', err);
        //setError('Failed to load course details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, currentUserId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>{error ? 'Error Loading Course' : 'Course Not Found'}</h2>
          <p>{error || "The course you're looking for doesn't exist or may have been removed."}</p>
          <button className="primary-btn" onClick={() => window.location.href = '/courses'}>
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  const { title, image, description, price, rating, tags, details } = course;
  const visibleReviews = reviews.slice(0, reviewPage * reviewsPerPage);

  return (
    <div className="course-detail-container">
      {/* Header */}
      <div className="course-header">
        <div className="course-hero">
          <div className="course-hero-content">
            <div className="breadcrumb">Courses / {title}</div>
            <h1 className="course-title">{title}</h1>
            <p className="course-short-desc">{description}</p>
            <div className="course-meta">
              <div className="meta-item">
                <span className="meta-label">Rating</span>
                <span className="meta-value">
                  <span className="stars">{'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}</span>
                  <span className="rating-number">{rating.toFixed(1)}/5.0</span>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Students</span>
                <span className="meta-value">{course.users?.filter(u => u).length || 0} enrolled</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Updated</span>
                <span className="meta-value">{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
            <div className="course-tags">
              {tags?.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
            <div className="share-buttons">
              <button className="share-btn" onClick={() => shareCourse('twitter')}>
                <i className="fab fa-twitter"></i> Twitter
              </button>
              <button className="share-btn" onClick={() => shareCourse('facebook')}>
                <i className="fab fa-facebook"></i> Facebook
              </button>
              <button className="share-btn" onClick={() => shareCourse('linkedin')}>
                <i className="fab fa-linkedin"></i> LinkedIn
              </button>
            </div>
            {isEnrolled && (
              <div className="progress-container">
                <span className="progress-text">Progress: {Math.round(progress)}%</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="course-hero-sidebar">
            <div className="course-card sticky">
              <img src={image} alt={title} className="course-card-image" />
              <div className="course-card-content">
                <div className="price-container">
                  <span className="current-price">${price.toFixed(2)}</span>
                  <span className="original-price">${(price * 2).toFixed(2)}</span>
                </div>
                <div className="action-buttonss">
                  {isEnrolled ? (
                    <button className="primary-btn" onClick={handleStartLearning}>
                      Start Learning
                    </button>
                  ) : (
                    <>
                      <button className="primary-btn" onClick={() => handleEnroll(id)}>
                        Enroll Now
                      </button>
                      <button className="secondary-btn">Add to Cart</button>
                    </>
                  )}
                  <button className="secondary-btn">Add to Wishlist</button>
                </div>
                <div className="course-includes">
                  <h4>This course includes:</h4>
                  <ul>
                    {details?.courseIncludes?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="course-navigation">
        <nav>
          <ul>
            {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
              <li
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="course-main-content">
        {activeTab === 'overview' && (
          <>
            <section className="what-youll-learn">
              <h2>What You'll Learn</h2>
              <div className="learn-grid">
                {details?.whatYouWillLearn?.map((item, i) => (
                  <div key={i} className="learn-item">
                    <svg className="check-icon" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="course-description">
              <h2>Course Description</h2>
              <p>{details?.fullDescription}</p>
            </section>
            <section className="requirements">
              <h2>Requirements</h2>
              <ul>
                {details?.requirements?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        {activeTab === 'curriculum' && (
          <section className="curriculum">
            <div className="curriculum-header">
              <h2>Course Content</h2>
              <div className="stats">
                <span>
                  {courseContent?.sections?.length} sections • {totalLectures} lectures •{' '}
                  {courseContent?.sections?.reduce((acc, section) => {
                    const sectionDuration = section.lectures.reduce((sum, lecture) => {
                      const [minutes, seconds] = lecture.duration.split(':').map(Number);
                      return sum + minutes * 60 + seconds;
                    }, 0);
                    return acc + sectionDuration;
                  }, 0) / 3600 || 'Unknown'} hours
                </span>
              </div>
            </div>
            <div className="course-content">
              {courseContent?.sections?.map((section, index) => (
                <div key={section._id} className="section">
                  <div
                    className="section-header"
                    onClick={() => toggleSection(index)}
                  >
                    <h4 className="section-title">{section.section}</h4>
                    <span className="section-meta">
                      {section.lectures?.length} lectures •{' '}
                      {section.lectures.reduce((sum, lecture) => {
                        const [minutes, seconds] = lecture.duration.split(':').map(Number);
                        return sum + minutes * 60 + seconds;
                      }, 0) / 60 || 'Unknown'} min
                    </span>
                    <span className="section-toggle">{expandedSections.includes(index) ? '▲' : '▼'}</span>
                  </div>
                  {expandedSections.includes(index) && (
                    <ul className="lecture-list">
                      {section.lectures?.map((lecture) => (
                        <li
                          key={lecture._id}
                          className={`lecture-item ${isEnrolled ? 'interactive' : ''}`}
                          onClick={isEnrolled ? () => handleStartLearning() : null}
                        >
                          <span className="lecture-title">{lecture.title}</span>
                          <div className="lecture-meta">
                            <span className="lecture-duration">{lecture.duration}</span>
                            {isEnrolled && completedLectures.includes(lecture._id) && (
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
                            {isEnrolled && !completedLectures.includes(lecture._id) && (
                              <button
                                className="complete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsCompleted(lecture._id);
                                }}
                              >
                                Mark as Completed
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'instructor' && instructor && (
          <section className="instructor-section">
            <h2>About the Instructor</h2>
            <div className="instructor-card">
              <div className="instructor-avatar">
                <img src={instructor.photo || 'https://randomuser.me/api/portraits/men/32.jpg'} alt={instructor.name} />
              </div>
              <div className="instructor-info">
                <h3>{instructor.name}</h3>
                <p className="title">{instructor.title || 'Senior Developer & Educator'}</p>
                <div className="instructor-stats">
                  <div className="stat-item">
                    <span className="stat-value">
                      {typeof instructor.averageRating === 'number' ? instructor.averageRating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="stat-label">Instructor Rating</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{instructor.studentCount || 0}</span>
                    <span className="stat-label">Students</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{instructor.courseCount || 0}</span>
                    <span className="stat-label">Courses</span>
                  </div>
                </div>
                <p className="instructor-bio">{instructor.bio}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'reviews' && (
          <section className="reviews-section">
            <h2>Student Reviews</h2>
            {visibleReviews.length > 0 ? (
              <>
                <div className="reviews-list">
                  {visibleReviews.map((review) => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-avatar">
                          <img
                            src={review.user.profilePicture || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                            alt={review.user.fullName}
                          />
                        </div>
                        <div className="reviewer-info">
                          <h4>{review.user.fullName}</h4>
                          <span className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        </div>
                      </div>
                      <p className="review-text">{review.comment}</p>
                      <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
                {reviewPage * reviewsPerPage < reviews.length && (
                  <button className="load-more-btn" onClick={loadMoreReviews}>
                    Load More Reviews
                  </button>
                )}
              </>
            ) : (
              <p>No reviews yet. Be the first to share your feedback!</p>
            )}
          </section>
        )}
      </div>

      {/* Recommended Courses */}
      {relatedCourses.length > 0 && (
        <section className="related-courses">
          <h2>Recommended Courses</h2>
          <div className="course-grid">
            {relatedCourses.map((related, i) => (
              <div key={i} className="course-card">
                <img src={related.image} alt={related.title} className="course-card-image" />
                <div className="course-card-content">
                  <h3>{related.title}</h3>
                  <p>{related.description.slice(0, 100)}...</p>
                  <span className="course-price">${related.price.toFixed(2)}</span>
                  <button
                    className="outline-btn"
                    onClick={() => window.location.href = `/courses/${related.id}`}
                  >
                    View Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CourseDetail;