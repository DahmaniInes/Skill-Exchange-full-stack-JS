import React, { useEffect } from 'react';
import axios from 'axios';
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { Routes, Route } from 'react-router-dom';
import { WOW } from 'wowjs';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import Login from "./pages/login/login";
import Signup from "./pages/signup/Signup";
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Contact from './pages/Contact';
import About from './pages/About';
import Courses from './pages/Courses';
import NotFound from './pages/NotFound';
import TotpStup from './pages/TotpSetup';
import ProfileForm from './pages/profile/ProfileForm';
import SecuritySettings from './pages/profile/SecuritySettings';
import Profile from './pages/profile/ProfilePage';
import MessengerPage from './pages/MessengerPages/MessengerPage';
import MessengerDefaultPage from './pages/MessengerPages/MessengerDefaultPage';
import ReportUserPage from './pages/MessengerPages/ReportUserPage';
import ConfirmPagePaiement from './pages/MessengerPages/ConfirmPaiementPage';
import CancelPagePaiement from './pages/MessengerPages/CancelPaiementPage';
import Marketplace from './pages/skills/Marketplace';
import MarketplaceSkills from './pages/skills/MarketplaceSkills';
import SkillDetails from './pages/skills/SkillDetails';
import RoadmapPage from './pages/skills/RoadmapPage';
import CreateRoadmapPage from './pages/skills/CreateRoadmapPage';
import InternshipFormPage from './pages/internships/InternshipFormPage';
import UserInternshipListPage from './pages/internships/UserInternshipListPage';
import EditInternshipPage from './pages/internships/EditInternshipPage';
import StudentInternshipListPage from './pages/internships/StudentInternshipListPage';
import ApplyInternshipPage from './pages/internships/ApplyInternshipPage';
import ApplicationsToMyOffersPage from './pages/internships/ApplicationsToMyOffersPage';
import StudentApplicationsTable from './pages/internships/StudentApplicationsTable';
import ManageInternshipTasksPage from "./pages/internships/ManageInternshipTasksPage";
import ApplicationProgressPage from "./pages/internships/ApplicationProgressPage";
import AdminDashboardPage from './pages/internships/AdminDashboard/AdminDashboardPage';
import { ConversationProvider } from './pages/MessengerPages/ConversationContext';

import 'bootstrap-icons/font/bootstrap-icons.css';
import 'font-awesome/css/font-awesome.min.css';
import 'animate.css';
import 'wowjs/css/libs/animate.css';

function App() {
  useEffect(() => {
    // Axios interceptor pour gérer le token JWT
    axios.interceptors.request.use(
      (config) => {
        console.log('Intercepteur appelé, headers:', config.headers);
        const token = localStorage.getItem('jwtToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          delete config.headers.Authorization;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Initialisation de WOW.js
    document.addEventListener('DOMContentLoaded', () => {
      const wow = new WOW({
        boxClass: 'wow',
        animateClass: 'animated',
        offset: 0,
        mobile: true,
        live: true,
        callback: function(box) {
          // Callback optionnel
        },
        scrollContainer: null,
        resetAnimation: true,
      });
      wow.init();
    });

    return () => {
      document.removeEventListener('DOMContentLoaded', () => {});
    };
  }, []);

  return (
    <ConversationProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="courses" element={<Courses />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="auth" element={<TotpStup />} />
          <Route path="profileForm" element={<ProfileForm />} />
          <Route path="SecuritySettings" element={<SecuritySettings />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Routes Messenger */}
          <Route path="MessengerPage" element={<MessengerPage />} />
          <Route path="ReportUserPage" element={<ReportUserPage />} />
          <Route path="MessengerDefaultPage" element={<MessengerDefaultPage />} />
          <Route path="ConfirmPagePaiement" element={<ConfirmPagePaiement />} />
          <Route path="CancelPagePaiement" element={<CancelPagePaiement />} />

          {/* Routes Skills */}
          <Route path="marketplace-skill" element={<Marketplace />} />
          <Route path="marketplaceSkills" element={<MarketplaceSkills />} />
          <Route path="skills/:skillId" element={<SkillDetails />} />
          <Route path="/roadmap/:roadmapId" element={<RoadmapPage />} />
          <Route path="/generate-roadmap" element={<CreateRoadmapPage />} />

          {/* Entrepreneur Routes for Internship Management */}
          <Route path="/internship-create" element={<InternshipFormPage />} />
          <Route path="/edit-internship/:id" element={<EditInternshipPage />} />
          <Route path="internships/entreprise" element={<UserInternshipListPage />} />
          <Route path="/internships/applications" element={<ApplicationsToMyOffersPage />} />
          <Route path="/applications/:applicationId/progress" element={<ApplicationProgressPage />} />

          {/* Student Routes for Internship Management */}
          <Route path="internships" element={<StudentInternshipListPage />} />
          <Route path="/internships/apply/:id" element={<ApplyInternshipPage />} />
          <Route path="/internships/student/applications" element={<StudentApplicationsTable />} />
          <Route path="/internships/:id/tasks" element={<ManageInternshipTasksPage />} />

          {/* Admin Routes */}
          <Route path="/admin/internships" element={<AdminDashboardPage />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ConversationProvider>
  );
}

export default App;