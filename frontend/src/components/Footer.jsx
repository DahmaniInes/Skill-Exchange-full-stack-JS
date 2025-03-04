import { Link } from 'react-router-dom';
import { useEffect } from 'react';

import course1 from '../assets/img/course-1.jpg';
import course2 from '../assets/img/course-2.jpg';
import course3 from '../assets/img/course-3.jpg';

// Puis les utiliser comme :

function Footer() {
  useEffect(() => {
    // Vous pouvez ajouter ici la logique pour initialiser les bibliothèques JS
    // si vous utilisez WOW.js, OwlCarousel, etc.
  }, []);

  return (
    <>
      {/* Footer Start */}
      <div
        className="container-fluid bg-dark text-light footer pt-5 mt-5 wow fadeIn"
        data-wow-delay="0.1s"
      >
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Quick Link</h4>
              <Link to="/about" className="btn btn-link">
                About Us
              </Link>
              <Link to="/contact" className="btn btn-link">
                Contact Us
              </Link>
              <Link to="/privacy" className="btn btn-link">
                Privacy Policy
              </Link>
              <Link to="/terms" className="btn btn-link">
                Terms & Condition
              </Link>
              <Link to="/faq" className="btn btn-link">
                FAQs & Help
              </Link>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Contact</h4>
              <p className="mb-2">
                <i className="fa fa-map-marker-alt me-3"></i>123 Street, New York, USA
              </p>
              <p className="mb-2">
                <i className="fa fa-phone-alt me-3"></i>+012 345 67890
              </p>
              <p className="mb-2">
                <i className="fa fa-envelope me-3"></i>info@example.com
              </p>
              <div className="d-flex pt-2">
                <a className="btn btn-outline-light btn-social" href="https://twitter.com">
                  <i className="fab fa-twitter"></i>
                </a>
                <a className="btn btn-outline-light btn-social" href="https://facebook.com">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a className="btn btn-outline-light btn-social" href="https://youtube.com">
                  <i className="fab fa-youtube"></i>
                </a>
                <a className="btn btn-outline-light btn-social" href="https://linkedin.com">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Gallery</h4>
              <div className="row g-2 pt-2">
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={course1} alt="course" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={course2} alt="course" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={course3} alt="course" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={course3} alt="course" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={course2} alt="course" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={course1} alt="course" />
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Newsletter</h4>
              <p>Dolor amet sit justo amet elitr clita ipsum elitr est.</p>
              <div className="position-relative mx-auto" style={{ maxWidth: '400px' }}>
                <input
                  className="form-control border-0 w-100 py-3 ps-4 pe-5"
                  type="text"
                  placeholder="Your email"
                />
                <button
                  type="button"
                  className="btn btn-primary py-2 position-absolute top-0 end-0 mt-2 me-2"
                >
                  SignUp
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="copyright">
            <div className="row">
              <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                &copy;{' '}
                <Link className="border-bottom" to="/">
                  Your Site Name
                </Link>
                , All Right Reserved.
                {/* Comment about HTML Codex - Keep if required */}
                Designed By{' '}
                <a className="border-bottom" href="https://htmlcodex.com">
                  HTML Codex
                </a>
                <br />
                <br />
                Distributed By{' '}
                <a className="border-bottom" href="https://themewagon.com">
                  ThemeWagon
                </a>
              </div>
              <div className="col-md-6 text-center text-md-end">
                <div className="footer-menu">
                  <Link to="/">Home</Link>
                  <Link to="/cookies">Cookies</Link>
                  <Link to="/help">Help</Link>
                  <Link to="/faq">FQAs</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer End */}

      {/* Back to Top */}
      <a href="#" className="btn btn-lg btn-primary btn-lg-square back-to-top">
        <i className="bi bi-arrow-up"></i>
      </a>

      {/* Les scripts sont mieux gérés dans un composant parent comme App.jsx ou dans le fichier principal */}
    </>
  );
}

export default Footer;
