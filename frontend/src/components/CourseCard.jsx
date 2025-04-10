import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  // Gestion de l'image par défaut si non définie
  const imageUrl = course.image || '/assets/img/default-course.jpg';
  
  return (
    <div className="course-item bg-light">
      <div className="position-relative overflow-hidden">
        <img 
          className="img-fluid" 
          src={imageUrl} 
          alt={course.title}
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = '/assets/img/default-course.jpg';
          }}
        />
        <div className="w-100 d-flex justify-content-center position-absolute bottom-0 start-0 mb-4">
          <Link 
            to={`/courses/${course.id}`} 
            className="flex-shrink-0 btn btn-sm btn-primary px-3 border-end" 
            style={{ borderRadius: '30px 0 0 30px' }}
          >
            See more
          </Link>
          <Link 
            to="#" 
            className="flex-shrink-0 btn btn-sm btn-primary px-3" 
            style={{ borderRadius: '0 30px 30px 0' }}
          >
            Register
          </Link>
        </div>
      </div>
      <div className="text-center p-4 pb-0">
        <h3 className="mb-0">${course.price}</h3>
        <div className="mb-3">
          {[...Array(5)].map((_, i) => (
            <small 
              key={i} 
              className={`fa fa-star ${i < Math.floor(course.rating) ? 'text-primary' : 'text-secondary'}`}
            ></small>
          ))}
          <small>({course.students || 0})</small>
        </div>
        <h5 className="mb-4">{course.title}</h5>
      </div>
      <div className="d-flex border-top">
        <small className="flex-fill text-center border-end py-2">
          <i className="fa fa-user-tie text-primary me-2"></i>
          {course.instructor}
        </small>
        <small className="flex-fill text-center border-end py-2">
          <i className="fa fa-clock text-primary me-2"></i>
          {course.duration}
        </small>
        <small className="flex-fill text-center py-2">
          <i className="fa fa-user text-primary me-2"></i>
          {course.students || 0} Étudiants
        </small>
      </div>
    </div>
  );
};

export default CourseCard;