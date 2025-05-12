import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { WOW } from 'wowjs';
import axios from 'axios';
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
import UserDashboard from './pages/MessengerPages/UserDashboard';

import StudentApplicationsTable from './pages/internships/StudentApplicationsTable';
import ManageInternshipTasksPage from "./pages/internships/ManageInternshipTasksPage";
import ApplicationProgressPage from "./pages/internships/ApplicationProgressPage";
import AdminDashboardPage from './pages/internships/AdminDashboard/AdminDashboardPage';
import RoleGuard from './guards/RoleGuard';
import Unauthorized from './pages/Unauthorized';
import FavoritesPage from './pages/skills/FavoritesPage';

import MessengerPage from './pages/MessengerPages/MessengerPage';
import MessengerDefaultPage from './pages/MessengerPages/MessengerDefaultPage';

import ReportUserPage from './pages/MessengerPages/ReportUserPage';

import ConfirmPagePaiement from './pages/MessengerPages/ConfirmPaiementPage';
import CancelPagePaiement from './pages/MessengerPages/CancelPaiementPage';

import { ConversationProvider } from './pages/MessengerPages/ConversationContext';

import CertificationForm from './/components/CertificationCourses/CertificationForm/CertificationForm';
import PeerValidation from './components/CertificationCourses/PeerValidation/PeerValidation';
import AllCourses from './components/CertificationCourses/AllCourses/AllCourses';
import MyCourses  from './components/CertificationCourses/MyCourses/MyCourses';
import CourseDetail  from './components/CertificationCourses/CourseDetail/CourseDetail';
import CreateCourse  from './components/CertificationCourses/CreateCourse/CreateCourse';
import LearnPage  from './components/CertificationCourses/LearnPage/LearnPage';
import CompletedCourses  from './components/CertificationCourses/CompletedCourses/CompletedCourses';

// Styles
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'font-awesome/css/font-awesome.min.css';
import 'animate.css';
import 'wowjs/css/libs/animate.css';


function App() {
  useEffect(() => {
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
    <ConversationProvider>
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
        <Route path="/roadmap/:id" element={<RoadmapPage />} />
        <Route path="/skills/:skillId" element={<SkillDetails />} />
        <Route path="/generate-roadmap" element={<CreateRoadmapPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />

        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="ReportUserPage" element={<ReportUserPage />} />

        <Route path="MessengerPage" element={<MessengerPage />} />
          <Route path="MessengerDefaultPage" element={<MessengerDefaultPage />} />
          <Route path="ConfirmPagePaiement" element={<ConfirmPagePaiement />} />
          <Route path="CancelPagePaiement" element={<CancelPagePaiement />} />
        {/* Entrepreneur Routes for Internship Management */}
        <Route path="/internship-create" element={<RoleGuard element={<InternshipFormPage />} allowedRoles="entrepreneur" />} />
        <Route path="/edit-internship/:id" element={<RoleGuard element={<EditInternshipPage />} allowedRoles="entrepreneur" />} />
        <Route path="/internships/entreprise" element={<RoleGuard element={<UserInternshipListPage />} allowedRoles="entrepreneur" />} />
        <Route path="/internships/applications" element={<RoleGuard element={<ApplicationsToMyOffersPage />} allowedRoles="entrepreneur" />} />
        <Route path="/applications/:applicationId/progress" element={<RoleGuard element={<ApplicationProgressPage />} allowedRoles="entrepreneur" />} />

        {/* Student Routes for Internship Management */}
        <Route path="internships" element={<RoleGuard element={<StudentInternshipListPage />} allowedRoles="student" />} />
        <Route path="/internships/apply/:id" element={<RoleGuard element={<ApplyInternshipPage />} allowedRoles="student" />} />
        <Route path="/internships/student/applications" element={<RoleGuard element={<StudentApplicationsTable />} allowedRoles="student" />} />
        <Route path="/internships/:id/tasks" element={<RoleGuard element={<ManageInternshipTasksPage />} allowedRoles="student" />} />

        {/* Admin Routes for Internship Management */}
        <Route path="/admin/internships" element={<RoleGuard element={<AdminDashboardPage />} allowedRoles="admin" />} />
        <Route path="ReportUserPage" element={<RoleGuard element={<ReportUserPage />} allowedRoles="admin" />} />

         {/* Courses */}
        {/* Courses */}
         <Route path="my-courses" element={<MyCourses  />} />
          <Route path="/courses" element={<AllCourses />}>
            <Route index element={<AllCourses userId="123" />} />
          </Route>
          <Route path="/course/:id" element={<CourseDetail />} />
            

          <Route path="/create-course" element={<CreateCourse />} />
          <Route path="/learn/:courseId" element={<LearnPage />} />
          <Route path="/CompletedCourses" element={<CompletedCourses />} />
          
          <Route path="certification-form" element={<CertificationForm />} />
            <Route path="peer-validation" element={<PeerValidation />} />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </ConversationProvider>

  );
}

export default App;