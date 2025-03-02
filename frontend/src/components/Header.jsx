import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import axios from 'axios';

// Import des styles CSS
import "../utils/css/bootstrap.min.css";
import "../utils/css/style.css";
import "../utils/lib/animate/animate.min.css";
import "../utils/lib/owlcarousel/assets/owl.carousel.min.css";

// Import des images
import carousel1 from "../assets/img/carousel-1.jpg";
import carousel2 from "../assets/img/carousel-2.jpg";

function Header() {
  const location = useLocation(); // Récupère le chemin actuel
  const isHomePage = location.pathname === "/";
  const carouselRef = useRef(null);
  const carouselInitializedRef = useRef(false);
  const [showCarousel, setShowCarousel] = useState(isHomePage);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // État pour gérer l'affichage du menu profil

  // État pour forcer la réinitialisation des animations
  const [animationKey, setAnimationKey] = useState(0);

  // Définition des titres et des breadcrumbs en fonction du chemin d'URL
  const pageTitles = {
    "/": "Home",
    "/about": "About Us",
    "/courses": "Courses",
    "/contact": "Contact",
    "/team": "Our Team",
    "/testimonial": "Testimonial",
    "/notfound": "Not Found",
  };


  const handleLogout = async (e) => {
    e.preventDefault();
    const sessionToken = localStorage.getItem("sessionToken"); // Get the session token from localStorage
  
    if (!sessionToken) {
      setError("No active session found.");
      return;
    }
  
    try {
      const response = await axios.post(
        "http://localhost:5000/users/logout", 
        {}, // No body content needed for logout
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`, // Add the session token to the Authorization header
          },
        }
      );
  
      console.log("Logout successful:", response.data);
      setMessage("Logout successful! Redirecting...");
      setError('');
      localStorage.removeItem("sessionToken"); // Remove the session token from localStorage
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
      setError("Logout failed");
      setMessage('');
    }
  };
  
  
  

  const title = pageTitles[location.pathname] || "Page";

  // Effet pour s'assurer que Bootstrap JS est chargé
  useEffect(() => {
    // Vérifier si Bootstrap est chargé
    if (typeof window !== 'undefined' && !window.bootstrap) {
      // Importer dynamiquement Bootstrap JS
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

  // Effet pour le spinner uniquement
  useEffect(() => {
    const spinner = document.getElementById("spinner");
    if (spinner) {
      setTimeout(() => {
        spinner.classList.remove("show");
      }, 1000);
    }
  }, []);

  // Effet pour détecter les changements de page
  useEffect(() => {
    // Quand la route change, mettre à jour l'état du carousel
    setShowCarousel(isHomePage);

    // Réinitialiser l'animation à chaque changement de route
    setAnimationKey(prevKey => prevKey + 1);

    // Ajout: forcer le défilement en haut de la page lors d'un changement
    window.scrollTo(0, 0);
  }, [isHomePage, location.pathname]);

  // Effet pour initialiser manuellement le carousel
  useEffect(() => {
    if (!showCarousel) return;

    let timeoutId = null;

    const setupCarousel = () => {
      // Vérifier que jQuery et OwlCarousel sont disponibles
      if (window.jQuery && window.jQuery.fn.owlCarousel) {
        // Seulement si l'élément carousel existe dans le DOM
        const carouselElement = document.querySelector(".header-carousel");
        if (!carouselElement) return;

        try {
          // Créer une nouvelle instance du carousel
          const $carousel = window.jQuery(".header-carousel");

          // Assurer que toute instance précédente est détruite
          if ($carousel.data('owl.carousel')) {
            $carousel.owlCarousel('destroy');
          }

          // Initialiser une nouvelle instance
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

          // Stocker la référence
          carouselRef.current = $carousel;
          carouselInitializedRef.current = true;
        } catch (error) {
          console.error("Erreur d'initialisation du carousel:", error);
        }
      } else {
        // Réessayer plus tard
        timeoutId = setTimeout(setupCarousel, 200);
      }
    };

    // Démarrer le processus
    setupCarousel();

    // Nettoyage
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Si nous quittons la page d'accueil, nettoyer complètement le carousel
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

  // Ajout d'un effet pour s'assurer que la navbar reste fixe
  useEffect(() => {
    // Ajuster le padding-top du body pour éviter que le contenu ne soit masqué
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const navbarHeight = navbar.offsetHeight;
      document.body.style.paddingTop = `${navbarHeight}px`;
    }

    // Si jamais la navbar n'est pas "sticky", on peut l'appliquer via JS
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

    // Appliquer immédiatement au chargement
    handleScroll();

    // Puis écouter les événements de défilement
    window.addEventListener('scroll', handleScroll);

    // Nettoyage
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.paddingTop = '0';
    };
  }, []);

  // Rendu conditionnel du carousel en fonction de l'état
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
        {/* Overlay for readability */}
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
      {/* Spinner Start */}
      <div
        id="spinner"
        className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
      >
        <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
      {/* Spinner End */}

      {/* Navbar Start - Modification pour garantir qu'elle est fixe */}
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
            <div className="nav-item dropdown">
              <a
                href="#"
                className="nav-link dropdown-toggle"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <i className="fa fa-user me-2"></i>Signup
              </a>
              {showProfileMenu && (
                <div className="dropdown-menu fade-down m-0">
                  <Link to="/profile" className="dropdown-item">
                    Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    Settings
                  </Link>
                  <span className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </span>
                </div>
              )}
            </div>
          </div>
          <Link to="/join" className="btn btn-primary py-4 px-lg-5 d-none d-lg-block">
            Join Now <i className="fa fa-arrow-right ms-3"></i>
          </Link>
        </div>
      </nav>
      {/* Navbar End */}

      {/* Rendu conditionnel du carousel ou du header de page */}
      {renderCarousel()}
      {renderPageHeader()}
    </>
  );
}

export default Header;