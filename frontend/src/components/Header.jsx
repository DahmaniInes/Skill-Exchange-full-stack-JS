import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../utils/css/bootstrap.min.css';
import '../utils/css/style.css';
import '../utils/lib/animate/animate.min.css';
import '../utils/lib/owlcarousel/assets/owl.carousel.min.css';

function Header() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') || 'Auto');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  useEffect(() => {
    const applyDarkMode = () => {
      document.body.classList.toggle('dark-mode', darkMode === 'Dark' || (darkMode === 'Auto' && prefersDark.matches));
    };
    applyDarkMode();
    if (darkMode === 'Auto') prefersDark.addEventListener('change', applyDarkMode);
    return () => prefersDark.removeEventListener('change', applyDarkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('language', language);
  }, [darkMode, language]);

  return (
    <nav className="navbar navbar-expand-lg bg-white shadow sticky-top py-3">
      <div className="container-fluid d-flex align-items-center">
        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center ms-3">
          <h2 className="m-0 text-primary fw-bold">
            <i className="fa fa-book me-2"></i> eLEARNING
          </h2>
        </Link>

        {/* Toggle Button */}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu */}
        <div className="collapse navbar-collapse justify-content-between" id="navbarCollapse">
          <ul className="navbar-nav mx-auto gap-4">
            <li className="nav-item"><Link to="/" className="nav-link active fw-bold">Home</Link></li>
            <li className="nav-item"><Link to="/about" className="nav-link fw-bold">About</Link></li>
            <li className="nav-item"><Link to="/courses" className="nav-link fw-bold">Courses</Link></li>
            <li className="nav-item dropdown">
              <a href="#" className="nav-link dropdown-toggle fw-bold" data-bs-toggle="dropdown">Pages</a>
              <ul className="dropdown-menu">
                <li><Link to="/team" className="dropdown-item">Our Team</Link></li>
                <li><Link to="/testimonial" className="dropdown-item">Testimonial</Link></li>
                <li><Link to="/404" className="dropdown-item">404 Page</Link></li>
              </ul>
            </li>
            <li className="nav-item"><Link to="/contact" className="nav-link fw-bold">Contact</Link></li>
          </ul>
        </div>

        {/* Options */}
        <div className="d-flex align-items-center">
          {/* Sélecteur de langue */}
          <div className="dropdown me-3">
            <button className="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">🌍 {language}</button>
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

          {/* Profil */}
          <div className="nav-item dropdown">
            <a href="#" className="nav-link dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown">
              <img src="https://via.placeholder.com/40" alt="User" className="rounded-circle me-2 border border-2 border-primary" />
              <span className="fw-semibold">User</span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><Link to="/posts" className="dropdown-item"><i className="fa fa-file-text-o me-2"></i>Posts</Link></li>
              <li><Link to="/profile" className="dropdown-item"><i className="fa fa-user-circle me-2"></i>Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><Link to="/logout" className="dropdown-item text-danger"><i className="fa fa-sign-out me-2"></i>Logout</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
