import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CourseCard from '../components/CourseCard';

// Import des images statiques
import cat1 from '../assets/img/cat-1.jpg';
import cat2 from '../assets/img/cat-2.jpg';
import cat3 from '../assets/img/cat-3.jpg';
import cat4 from '../assets/img/cat-4.jpg';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([
    { name: "Web Design", count: 0 },
    { name: "Graphic Design", count: 0 },
    { name: "Video Editing", count: 0 },
    { name: "Online Marketing", count: 0 }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error('Échec du chargement des cours');
        }
        const data = await response.json();
        setCourses(data);
        
        const updatedCategories = categories.map(cat => ({
          ...cat,
          count: data.filter(course => course.category === cat.name).length
        }));
        setCategories(updatedCategories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [location.search]);

  useEffect(() => {
    let result = [...courses];
    
    // Filtrage par recherche
    if (searchTerm) {
      result = result.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrage par catégorie depuis l'URL
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) {
      result = result.filter(course => 
        course.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Tri des résultats
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    
    setFilteredCourses(result);
  }, [courses, searchTerm, sortOption, location.search]);

  if (loading) {
    return (
      <div className="container-xxl py-5">
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-xxl py-5">
        <div className="container text-center py-5">
          <div className="alert alert-danger" role="alert">
            Erreur: {error}
          </div>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Categories Section */}
      <div className="container-xxl py-5 category">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Categories</h6>
            <h1 className="mb-5">Courses Categories</h1>
          </div>
          <div className="row g-3">
            <div className="col-lg-7 col-md-6">
              <div className="row g-3">
                <div className="col-lg-12 col-md-12 wow zoomIn" data-wow-delay="0.1s">
                  <Link className="position-relative d-block overflow-hidden" to="/courses?category=Web+Design">
                    <img className="img-fluid" src={cat1} alt="Web Design" />
                    <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                      <h5 className="m-0">Web Design</h5>
                      <small className="text-primary">{categories[0].count} Courses</small>
                    </div>
                  </Link>
                </div>
                <div className="col-lg-6 col-md-12 wow zoomIn" data-wow-delay="0.3s">
                  <Link className="position-relative d-block overflow-hidden" to="/courses?category=Graphic+Design">
                    <img className="img-fluid" src={cat2} alt="Graphic Design" />
                    <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                      <h5 className="m-0">Graphic Design</h5>
                      <small className="text-primary">{categories[1].count} Courses</small>
                    </div>
                  </Link>
                </div>
                <div className="col-lg-6 col-md-12 wow zoomIn" data-wow-delay="0.5s">
                  <Link className="position-relative d-block overflow-hidden" to="/courses?category=Video+Editing">
                    <img className="img-fluid" src={cat3} alt="Video Editing" />
                    <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                      <h5 className="m-0">Video Editing</h5>
                      <small className="text-primary">{categories[2].count} Courses</small>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-5 col-md-6 wow zoomIn" data-wow-delay="0.7s" style={{ minHeight: '350px' }}>
              <Link className="position-relative d-block h-100 overflow-hidden" to="/courses?category=Online+Marketing">
                <img className="img-fluid position-absolute w-100 h-100" src={cat4} alt="Online Marketing" style={{ objectFit: 'cover' }} />
                <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                  <h5 className="m-0">Online Marketing</h5>
                  <small className="text-primary">{categories[3].count} Courses</small>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Courses</h6>
            <h1 className="mb-5">Courses List</h1>
          </div>
          
          {/* Barre de recherche et tri */}
          <div className="row mb-4">
            <div className="col-md-8 mb-3 mb-md-0">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Search for a course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-primary" type="button">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
            <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">Courses Sorting : </span>
              <select 
                className="form-select border-start-0"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{ paddingLeft: '0.5rem' }}
              >
                <option value="newest">Most recent</option>
                <option value="oldest">Older</option>
                <option value="price-asc">Price (ascending)</option>
                <option value="price-desc">Price (descending)</option>
                <option value="rating">Best reviews</option>
              </select>
            </div>
          </div>
          </div>
          
          {filteredCourses.length === 0 ? (
            <div className="text-center py-5">
              <h4>{searchTerm ? "No courses match your search" : "Aucun cours disponible pour le moment"}</h4>
              <p>{searchTerm ? "Try other terms or change your filters" : "Revenez plus tard ou explorez nos autres sections"}</p>
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {filteredCourses.map((course, index) => (
                <div key={course.id} className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay={`${0.1 * index}s`}>
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Courses;