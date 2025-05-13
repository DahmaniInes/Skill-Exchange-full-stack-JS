// Correction de la ligne d'import React
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../interceptor/axiosInstance";
import axios from 'axios';
import io from 'socket.io-client'; // Ajout de l'import pour Socket.IO

// Import des styles CSS
import "../utils/css/bootstrap.min.css";
import "../utils/css/style.css";
import "../utils/lib/animate/animate.min.css";
import { jwtDecode } from "jwt-decode";
import "../utils/lib/owlcarousel/assets/owl.carousel.min.css";

// Import des images
import carousel1 from "../assets/img/carousel-1.jpg";
import carousel2 from "../assets/img/carousel-2.jpg";

function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const carouselRef = useRef(null);
  const carouselInitializedRef = useRef(false);
  const socketRef = useRef(null); // Référence pour Socket.IO
  const [showCarousel, setShowCarousel] = useState(isHomePage);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") || "Auto"
  );
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState(null); // ID de l'utilisateur
  const [unseenMessages, setUnseenMessages] = useState({}); // État pour les messages non lus
 
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
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("jwtToken");
  let userRole = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded?.userRole || null;
    } catch (error) {
      console.error("Invalid token:", error);
      userRole = null;
    }
  }

  const [loading, setLoading] = useState(true);
  const DEFAULT_AVATAR =
    "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg";

  const handleProfileError = useCallback(
    (error) => {
      console.error("Profile fetch error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("jwtToken");
        navigate("/login", {
          state: {
            from: location,
            error: "Session expired. Please login again.",
          },
        });
      }
    },
    [navigate, location]
  );

  // Correction 2: Utilisation correcte de useCallback
  // Modification de la fonction fetchUserProfile
  // Header.jsx
  // Header.jsx
  const fetchUserProfile = useCallback(
    async (signal) => {
      try {
        const response = await axiosInstance.get("/api/me", { signal });

        if (response.data.status !== "success") {
          throw new Error(response.data.message || "Erreur inconnue");
        }

        // Formater les dates
        const formatDate = (dateString) =>
          dateString ? new Date(dateString).toLocaleDateString() : "Present";

        const processedUser = {
          ...response.data.data.user,
          experiences: response.data.data.user.experiences.map((exp) => ({
            ...exp,
            period: `${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}`,
          })),
        };

        setUser(processedUser);
      } catch (error) {
        handleProfileError(error);

        // Journalisation détaillée
        console.error("Erreur fetch:", {
          message: error.message,
          code: error.response?.data?.code,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    },
    [handleProfileError]
  );


  // Fetch user profile
  useEffect(() => {
    const abortController = new AbortController();

    const isTokenValid = () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) return false;

      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId); // Récupérer l'ID de l'utilisateur
        return decoded.exp * 1000 > Date.now();
      } catch (e) {
        console.error("Token validation error:", e);
        return false;
      }
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        if (!isTokenValid()) {
          localStorage.removeItem("jwtToken");
          setUser(null);
          return;
        }

        await fetchUserProfile(abortController.signal);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [fetchUserProfile, navigate, location]);

  // Initialisation de Socket.IO pour les messages
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket : Connecté au serveur avec userId', currentUserId);
      socketRef.current.emit('authenticate', currentUserId);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket : Erreur de connexion', error.message);
    });

    socketRef.current.on('newMessage', (message) => {
      console.log('Socket : Nouveau message reçu:', message);

      if (!message || !message.conversation?._id || !message._id) {
        console.error('Message invalide ou incomplet:', message);
        return;
      }

      if (
        message.sender?._id !== currentUserId &&
        !message.read &&
        location.pathname !== "/MessengerDefaultPage"
      ) {
        setUnseenMessages((prev) => {
          const updated = { ...prev, [message.conversation._id]: true };
          console.log('Messages non lus mis à jour:', updated);
          return updated;
        });
      }
    });

    const fetchConversations = async () => {
      try {
        const response = await axiosInstance.get('/MessengerRoute/conversations');
        const conversations = response.data.data || [];
        const newUnseenMessages = {};
        conversations.forEach(conv => {
          if (
            conv?.lastMessage &&
            conv.lastMessage.sender?._id !== currentUserId &&
            !conv.lastMessage.read
          ) {
            newUnseenMessages[conv._id] = true;
          }
        });
        setUnseenMessages(newUnseenMessages);
        console.log('Conversations initiales chargées, messages non lus:', newUnseenMessages);
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      }
    };

    if (currentUserId) {
      fetchConversations();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('newMessage');
        socketRef.current.disconnect();
        console.log('Socket : Déconnexion effectuée');
      }
    };
  }, [currentUserId]);

  // Réinitialiser les messages non lus quand on visite la page Messenger
  useEffect(() => {
    if (location.pathname === "/MessengerDefaultPage") {
      setUnseenMessages({});
      const markAllAsRead = async () => {
        try {
          await axiosInstance.post('/MessengerRoute/mark-messages-as-read', {
            userId: currentUserId,
          });
          console.log('Tous les messages ont été marqués comme lus');
        } catch (error) {
          console.error('Erreur lors de la mise à jour des messages comme lus:', error);
        }
      };
      markAllAsRead();
    }
  }, [location.pathname, currentUserId]);

  // Calculer le nombre total de messages non lus
  const unseenCount = Object.values(unseenMessages).filter(Boolean).length;

  // Gestion du clic sur le lien Messenger
  const handleMessengerClick = (e) => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      e.preventDefault();
      navigate('/login');
    }
  };

  // Dark mode management
  useEffect(() => {
    const applyDarkMode = () => {
      document.body.classList.toggle(
        "dark-mode",
        darkMode === "Dark" || (darkMode === "Auto" && prefersDark.matches)
      );
    };
    applyDarkMode();
    if (darkMode === "Auto")
      prefersDark.addEventListener("change", applyDarkMode);
    return () => prefersDark.removeEventListener("change", applyDarkMode);
  }, [darkMode]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    localStorage.setItem("language", language);
  }, [darkMode, language]);

  // Logout
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/logout");
      localStorage.removeItem("jwtToken");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };

  // Bootstrap initialization
  useEffect(() => {
    if (typeof window !== "undefined" && !window.bootstrap) {
      const loadBootstrap = async () => {
        try {
          await import("bootstrap/dist/js/bootstrap.bundle.min.js");
        } catch (err) {
          console.error("Erreur de chargement de Bootstrap JS:", err);
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

  // Page change handling
  useEffect(() => {
    setShowCarousel(isHomePage);
    setAnimationKey((prevKey) => prevKey + 1);
    window.scrollTo(0, 0);
  }, [isHomePage, location.pathname]);

  // Carousel initialization (similar to previous implementation)
  useEffect(() => {
    // ... (previous carousel initialization code remains the same)
  }, [showCarousel]);

  // Navbar fixed positioning
  useEffect(() => {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      const navbarHeight = navbar.offsetHeight;
      document.body.style.paddingTop = `${navbarHeight}px`;
    }

    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (navbar) {
        if (window.scrollY > 0) {
          navbar.style.position = "fixed";
          navbar.style.top = "0";
          navbar.style.width = "100%";
          navbar.style.zIndex = "1030";
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.style.paddingTop = "0";
    };
  }, []);

  // Carousel rendering (similar to previous implementation)
  const renderCarousel = () => {
    /* ... */
  };

  // Page header rendering (similar to previous implementation)
  const renderPageHeader = () => {
    /* ... */
  };

  return (
    <>
      {/* Spinner */}
      <div
        id="spinner"
        className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
      >
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>

      {/* Navbar */}
      <nav
        className="navbar navbar-expand-lg bg-white navbar-light shadow p-0"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 1030,
        }}
      >
        <Link
          to="/"
          className="navbar-brand d-flex align-items-center px-4 px-lg-5"
        >
          <h2 className="m-0 text-primary">
            <i className="fa fa-book me-3"></i>E-learning
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
            <Link
              to="/"
              className={`nav-item nav-link ${
                location.pathname === "/" ? "active" : ""
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`nav-item nav-link ${
                location.pathname === "/about" ? "active" : ""
              }`}
            >
              About
            </Link>
            <Link
              to="/courses"
              className={`nav-item nav-link ${
                location.pathname === "/courses" ? "active" : ""
              }`}
            >
              Courses
            </Link>

            {/* Conditional display based on role */}
            {userRole === "student" && (
              <>
                <Link
                  to="/internships"
                  className={`nav-item nav-link ${
                    location.pathname.endsWith("internships") ? "active" : ""
                  }`}
                >
                  Internships
                </Link>
                <Link
                  to="/internships/student/applications"
                  className={`nav-item nav-link ${
                    location.pathname.includes("/student/applications") ? "active" : ""
                  }`}
                >
                  My Applications
                </Link>
              </>
            )}

            {userRole === "entrepreneur" && (
              <>
                <Link to="/internship-create" className="nav-item nav-link">
                  Create Internship
                </Link>
                <Link
                  to="/internships/entreprise"
                  className="nav-item nav-link"
                >
                  My Offers
                </Link>
                <Link
                  to="/internships/applications"
                  className="nav-item nav-link"
                >
                  Applications
                </Link>
              </>
            )}

            {userRole === "admin" && (
              <Link to="/admin/internships" className="nav-item nav-link">
                Manage Internships
              </Link>
            )}
              <Link to="/courses" className={`nav-item nav-link ${location.pathname === "/courses" ? "active" : ""}`}>
              Courses
            </Link>
            <Link to="/my-courses" className={`nav-item nav-link ${location.pathname === "/marketplace-skill" ? "active" : ""}`}>
              Enrolled
            </Link>

            <Link to="/marketplace-skill" className="nav-item nav-link">
              Marketplace Skill
              </Link>
               </Link>
            <Link to="/internships" className={`nav-item nav-link ${location.pathname === "/internships" ? "active" : ""}`}>
              Internships </Link>

            {/* Ajout du lien Messenger avec l'icône et le compteur */}
            <Link 
              to="/MessengerDefaultPage" 
              className={`nav-item nav-link ${location.pathname === "/MessengerDefaultPage" ? "active" : ""}`} 
              onClick={handleMessengerClick}
            >
              <div style={{ position: "relative" }}>
                <i className="fa fa-envelope me-2"></i>
                {unseenCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "red",
                      color: "white",
                      borderRadius: "50%",
                      width: "16px",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {unseenCount}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Language and Dark Mode Selectors */}
          <div className="d-flex align-items-center me-4">
            {/* Language Selector */}
            <div className="dropdown me-3">
              <button
                className="btn btn-light dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                🌍 {language}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => setLanguage("English")}
                  >
                    🇬🇧 English
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => setLanguage("Español")}
                  >
                    🇪🇸 Español
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => setLanguage("Français")}
                  >
                    🇫🇷 Français
                  </a>
                </li>
              </ul>
            </div>

            {/* Dark Mode Selector */}
            <div className="dropdown me-3">
              <button
                className="btn btn-light dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                {darkMode === "Light"
                  ? "☀️"
                  : darkMode === "Dark"
                  ? "🌙"
                  : "🌗"}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => setDarkMode("Light")}
                  >
                    ☀️ Light
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => setDarkMode("Dark")}
                  >
                    🌙 Dark
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => setDarkMode("Auto")}
                  >
                    🌗 Auto
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* User Profile/Authentication Section */}
          <div className="nav-item dropdown me-4">
            {user ? (
              <a
                href="#"
                className="nav-link dropdown-toggle d-flex align-items-center"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <img
                  src={user?.profilePicture || DEFAULT_AVATAR}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR;
                    e.target.classList.add("error-avatar");
                  }}
                  className="rounded-circle me-2 border border-2 border-primary"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                  }}
                  alt={`${user?.firstName || ""} ${
                    user?.lastName || "Utilisateur"
                  }`}
                  loading="lazy"
                />
                <span className="fw-semibold">
                  {`${user.firstName} ${user.lastName}`.trim() || "User"}
                </span>
              </a>
            ) : (
              <Link to="/login" className="btn btn-outline-primary me-2">
                Login
              </Link>
            )}

            {user && showProfileMenu && (
              <div className="dropdown-menu fade-down m-0 dropdown-menu-end">
                <Link to="/posts" className="dropdown-item">
                  <i className="fa fa-file-text-o me-2"></i>Posts
                </Link>
                <Link to="/profile" className="dropdown-item">
                  <i className="fa fa-user-circle me-2"></i>Profile
                </Link>
                <hr className="dropdown-divider" />
                <span
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <i className="fa fa-sign-out me-2"></i>Logout
                </span>
              </div>
            )}
          </div>

          <Link
            to="/join"
            className="btn btn-primary py-4 px-lg-5 d-none d-lg-block"
          >
            Join Now <i className="fa fa-arrow-right ms-3"></i>
          </Link>
        </div>
      </nav>

      {renderCarousel()}
      {renderPageHeader()}
    </>
  );
}

export default Header;
