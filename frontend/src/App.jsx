import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { WOW } from 'wowjs';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import Login from "./pages/login/login";
import Signup from "./pages/signup/SignUp";
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
// Styles
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'font-awesome/css/font-awesome.min.css';
import 'animate.css';
import 'wowjs/css/libs/animate.css';


function App() {
  useEffect(() => {
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
      const wow = new WOW({
        boxClass: 'wow',
        animateClass: 'animated',
        offset: 0,
        mobile: true,
        live: true,
        callback: function(box) {
          // Optional callback
        },
        scrollContainer: null,
        resetAnimation: true
      });
      wow.init();
    });

    // Cleanup
    return () => {
      document.removeEventListener('DOMContentLoaded', () => {});
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} /> {/* Added index route */}
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
        <Route path="marketplace-skill" element={<Marketplace />} />
        <Route path="marketplaceSkills" element={<MarketplaceSkills />} />
        <Route path="skills/:skillId" element={<SkillDetails />} /> 
        <Route path="/roadmap/:roadmapId" element={<RoadmapPage />} />
        <Route path="/generate-roadmap" element={<CreateRoadmapPage />} />
        <Route path="/internship-create" element={<InternshipFormPage />} />
        <Route path="/edit-internship/:id" element={<EditInternshipPage />} />
        <Route path="internships/entreprise" element={<UserInternshipListPage />} />
        <Route path="internships" element={<StudentInternshipListPage />} />
        <Route path="/internships/apply/:id" element={<ApplyInternshipPage />} />
        <Route path="/internships/applications" element={<ApplicationsToMyOffersPage />} />
        <Route path="/internships/student/applications" element={<StudentApplicationsTable />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;