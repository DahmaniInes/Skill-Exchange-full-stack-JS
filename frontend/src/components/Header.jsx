import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../interceptor/axiosInstance";

// Import des styles CSS
import "../utils/css/bootstrap.min.css";
import "../utils/css/style.css";
import "../utils/lib/animate/animate.min.css";
import "../utils/lib/owlcarousel/assets/owl.carousel.min.css";

// Import des images
import carousel1 from "../assets/img/carousel-1.jpg";
import carousel2 from "../assets/img/carousel-2.jpg";

function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const carouselRef = useRef(null);
  const carouselInitializedRef = useRef(false);
  const [showCarousel, setShowCarousel] = useState(isHomePage);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') || 'Auto');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const navigate = useNavigate();

  // Définition des titres
  const pageTitles = {
    "/": "Home",
    "/about": "About Us",
    "/courses": "Courses",
    "/contact": "Contact",
    "/team": "Our Team",
    "/testimonial": "Testimonial",
    "/notfound": "Not Found",
  };

  const title = pageTitles[location.pathname] || "Page";

  // Gestion du dark mode
  useEffect(() => {
    const applyDarkMode = () => {
      document.body.classList.toggle('dark-mode', darkMode === 'Dark' || (darkMode === 'Auto' && prefersDark.matches));
    };
    applyDarkMode();
    if (darkMode === 'Auto') prefersDark.addEventListener('change', applyDarkMode);
    return () => prefersDark.removeEventListener('change', applyDarkMode);
  }, [darkMode]);

  // Sauvegarde des préférences
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('language', language);
  }, [darkMode, language]);

  // Logout
  const handleLogout = async () => {
    try {
      const response = await axiosInstance.post("/users/logout");
      console.log("Logout successful:", response.data);
      localStorage.removeItem("jwtToken");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };

  // Initialisation Bootstrap
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.bootstrap) {
      const loadBootstrap = async () => {
        try {
          await import('bootstrap/dist/js/bootstrap.bundle.min.js');
          console.log('Bootstrap JS chargé avec succès');
        } catch (err) {
          console.error('Erreur de chargement de Bootstrap JS:', err);
        }
      };
      loadBootstrap();
    }
  }, []);

  // Spinner
  useEffect(() => {
    const spinner = document.getElementById("spinner");
    if (spinner) {
      setTimeout(() => {
        spinner.classList.remove("show");
      }, 1000);
    }
  }, []);

  // Gestion du changement de page
  useEffect(() => {
    setShowCarousel(isHomePage);
    setAnimationKey(prevKey => prevKey + 1);
    window.scrollTo(0, 0);
  }, [isHomePage, location.pathname]);

  // Carousel
  useEffect(() => {
    if (!showCarousel) return;

    let timeoutId = null;

    const setupCarousel = () => {
      if (window.jQuery && window.jQuery.fn.owlCarousel) {
        const carouselElement = document.querySelector(".header-carousel");
        if (!carouselElement) return;

        try {
          const $carousel = window.jQuery(".header-carousel");
          if ($carousel.data('owl.carousel')) {
            $carousel.owlCarousel('destroy');
          }

          $carousel.owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            items: 1,
            dots: true,
            loop: true,
            nav: true,
            navText: [
              '<i class="bi bi-chevron-left"></i>',
              '<i class="bi bi-chevron-right"></i>'
            ]
          });

          carouselRef.current = $carousel;
          carouselInitializedRef.current = true;
        } catch (error) {
          console.error("Erreur d'initialisation du carousel:", error);
        }
      } else {
        timeoutId = setTimeout(setupCarousel, 200);
      }
    };

    setupCarousel();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (carouselInitializedRef.current && carouselRef.current) {
        try {
          carouselRef.current.owlCarousel('destroy');
          carouselInitializedRef.current = false;
        } catch (error) {
          console.error("Erreur lors du nettoyage du carousel:", error);
        }
      }
    };
  }, [showCarousel]);

  // Navbar fixe
  useEffect(() => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const navbarHeight = navbar.offsetHeight;
      document.body.style.paddingTop = `${navbarHeight}px`;
    }

    const handleScroll = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        if (window.scrollY > 0) {
          navbar.style.position = 'fixed';
          navbar.style.top = '0';
          navbar.style.width = '100%';
          navbar.style.zIndex = '1030';
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.paddingTop = '0';
    };
  }, []);

  // Rendu conditionnel du carousel
  const renderCarousel = () => {
    if (!showCarousel) return null;

    return (
      <div className="container-fluid p-0 mb-5" key={`carousel-${animationKey}`}>
        <div className="owl-carousel header-carousel position-relative">
          <div className="owl-carousel-item position-relative">
            <img className="img-fluid" src={carousel1} alt="Best Online Learning Platform" />
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" style={{ background: "rgba(24, 29, 56, .7)" }}>
              <div className="container">
                <div className="row justify-content-start">
                  <div className="col-sm-10 col-lg-8">
                    <h5 className="text-primary text-uppercase mb-3 animated slideInDown">Best Online Courses</h5>
                    <h1 className="display-3 text-white animated slideInDown">The Best Online Learning Platform</h1>
                    <p className="fs-5 text-white mb-4 pb-2">Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea sanctus eirmod elitr.</p>
                    <Link to="/about" className="btn btn-primary py-md-3 px-md-5 me-3 animated slideInLeft">Read More</Link>
                    <Link to="/join" className="btn btn-light py-md-3 px-md-5 animated slideInRight">Join Now</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="owl-carousel-item position-relative">
            <img className="img-fluid" src={carousel2} alt="Get Educated Online From Your Home" />
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" style={{ background: "rgba(24, 29, 56, .7)" }}>
              <div className="container">
                <div className="row justify-content-start">
                  <div className="col-sm-10 col-lg-8">
                    <h5 className="text-primary text-uppercase mb-3 animated slideInDown">Best Online Courses</h5>
                    <h1 className="display-3 text-white animated slideInDown">Get Educated Online From Your Home</h1>
                    <p className="fs-5 text-white mb-4 pb-2">Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea sanctus eirmod elitr.</p>
                    <Link to="/about" className="btn btn-primary py-md-3 px-md-5 me-3 animated slideInLeft">Read More</Link>
                    <Link to="/join" className="btn btn-light py-md-3 px-md-5 animated slideInRight">Join Now</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu conditionnel du header des autres pages
  const renderPageHeader = () => {
    if (showCarousel) return null;

    return (
      <div
        className=""
        style={{
          position: "relative",
        }}
        key={`page-header-${animationKey}`}
      >
        <div
          style={{
            displaynone: "none",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(24, 29, 56, .7)",
          }}
        ></div>
      </div>
    );
  };

  return (
    <>
      {/* Spinner */}
      <div
        id="spinner"
        className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
      >
        <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>

      {/* Navbar avec les améliorations */}
      <nav
        className="navbar navbar-expand-lg bg-white navbar-light shadow p-0"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1030
        }}
      >
        <Link to="/" className="navbar-brand d-flex align-items-center px-4 px-lg-5">
          <h2 className="m-0 text-primary">
            <i className="fa fa-book me-3"></i>eLEARNING
          </h2>
        </Link>
        
        <button
          type="button"
          className="navbar-toggler me-4"
          data-bs-toggle="collapse"
          data-bs-target="#navbarCollapse"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarCollapse">
          <div className="navbar-nav ms-auto p-4 p-lg-0">
            <Link to="/" className={`nav-item nav-link ${location.pathname === "/" ? "active" : ""}`}>
              Home
            </Link>
            <Link to="/about" className={`nav-item nav-link ${location.pathname === "/about" ? "active" : ""}`}>
              About
            </Link>
            <Link to="/courses" className={`nav-item nav-link ${location.pathname === "/courses" ? "active" : ""}`}>
              Courses
            </Link>
            <div className="nav-item dropdown">
              <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                Pages
              </a>
              <div className="dropdown-menu fade-down m-0">
                <Link to="/team" className={`dropdown-item ${location.pathname === "/team" ? "active" : ""}`}>
                  Our Team
                </Link>
                <Link to="/testimonial" className={`dropdown-item ${location.pathname === "/testimonial" ? "active" : ""}`}>
                  Testimonial
                </Link>
                <Link to="/notfound" className={`dropdown-item ${location.pathname === "/notfound" ? "active" : ""}`}>
                  404 Page
                </Link>
              </div>
            </div>
            <Link to="/contact" className={`nav-item nav-link ${location.pathname === "/contact" ? "active" : ""}`}>
              Contact
            </Link>
          </div>

          {/* Ajout des nouvelles fonctionnalités */}
          <div className="d-flex align-items-center me-4">
            {/* Sélecteur de langue */}
            <div className="dropdown me-3">
              <button className="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                🌍 {language}
              </button>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#" onClick={() => setLanguage('English')}>🇬🇧 English</a></li>
                <li><a className="dropdown-item" href="#" onClick={() => setLanguage('Español')}>🇪🇸 Español</a></li>
                <li><a className="dropdown-item" href="#" onClick={() => setLanguage('Français')}>🇫🇷 Français</a></li>
              </ul>
            </div>

            {/* Mode sombre */}
            <div className="dropdown me-3">
              <button className="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                {darkMode === 'Light' ? '☀️' : darkMode === 'Dark' ? '🌙' : '🌗'}
              </button>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#" onClick={() => setDarkMode('Light')}>☀️ Light</a></li>
                <li><a className="dropdown-item" href="#" onClick={() => setDarkMode('Dark')}>🌙 Dark</a></li>
                <li><a className="dropdown-item" href="#" onClick={() => setDarkMode('Auto')}>🌗 Auto</a></li>
              </ul>
            </div>
          </div>

          {/* Menu profil amélioré */}
          <div className="nav-item dropdown me-4">
            <a
              href="#"
              className="nav-link dropdown-toggle d-flex align-items-center"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <img 
                src="https://via.placeholder.com/40" 
                alt="User" 
                className="rounded-circle me-2 border border-2 border-primary" 
                style={{ width: '40px', height: '40px' }}
              />
              <span className="fw-semibold">User</span>
            </a>
            {showProfileMenu && (
              <div className="dropdown-menu fade-down m-0 dropdown-menu-end">
                <Link to="/posts" className="dropdown-item">
                  <i className="fa fa-file-text-o me-2"></i>Posts
                </Link>

                <Link to="/login" className="dropdown-item">
                  <i className="fa fa-file-text-o me-2"></i>Login
                </Link>

                <Link to="/profile" className="dropdown-item">
                  <i className="fa fa-user-circle me-2"></i>Profile
                </Link>
                <hr className="dropdown-divider" />
                <span className="dropdown-item text-danger" onClick={handleLogout}>
                  <i className="fa fa-sign-out me-2"></i>Logout
                </span>
              </div>
            )}
          </div>

          <Link to="/join" className="btn btn-primary py-4 px-lg-5 d-none d-lg-block">
            Join Now <i className="fa fa-arrow-right ms-3"></i>
          </Link>
        </div>
      </nav>

      {/* Rendu conditionnel du carousel ou du header de page */}
      {renderCarousel()}
      {renderPageHeader()}
    </>
  );
}

export default Header;