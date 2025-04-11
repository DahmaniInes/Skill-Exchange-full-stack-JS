import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Styles globaux
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Layouts
import MainLayout from './frontoffice/layouts/MainLayout';
import BackOfficeLayout from './backoffice/src/layouts/main-layout/BackOfficeLayout'; // pas besoin d’ajouter /index

// Composants de protection
import PrivateRoute from './backoffice/src/components/PrivateRoute';
import PublicOnlyRoute from './frontoffice/components/PublicOnlyRoute';

// Contexte d'authentification
import { AuthProvider } from './backoffice/src/providers/AuthProvider';
import Login from './frontoffice/pages/login/login';
import Home from './frontoffice/pages/Home';
import Contact from './frontoffice/pages/Contact';
import About from './frontoffice/pages/About';
import Courses from './frontoffice/pages/Courses';
import NotFound from './frontoffice/pages/NotFound';
import TotpStup from './frontoffice/pages/TotpSetup';
import ProfileForm from './frontoffice/pages/profile/ProfileForm'; // Ton composant de modification de profil // Exemple d'un autre composant
import SecuritySettings from './frontoffice/pages/profile/SecuritySettings'; // Exemple d'un autre composant
import Profile from './frontoffice/pages/profile/ProfilePage'; // Composanticher le profil pour aff
import Signup from "./frontoffice/pages/signup/SignUp";

import SkillExchange from './frontoffice/pages/SkillExchange';
import CertificationForm from './frontoffice/components/CertificationCourses/CertificationForm';
import PeerValidation from './frontoffice/components/CertificationCourses/PeerValidation';
import AllCourses from './frontoffice/components/CertificationCourses/AllCourses';
import MyCourses  from './frontoffice/components/CertificationCourses/MyCourses';
import CourseDetail  from './frontoffice/components/CertificationCourses/CourseDetail';


// Rendu de l'application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Routes publiques (FrontOffice) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/*" element={<MainLayout />} />
          </Route>

          {/* Routes privées (BackOffice) */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin/*" element={<BackOfficeLayout />} />
          </Route>
          <Route element={<Login />}>
            <Route path="/login" element={<MainLayout />} />
          </Route>
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth" element={<TotpStup />} />
          <Route path="profileForm" element={<ProfileForm />} />
          <Route path="SecuritySettings" element={<SecuritySettings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-courses" element={<MyCourses  />} />
          <Route path="/courses" element={<AllCourses />}>
            <Route index element={<AllCourses userId="123" />} />
            <Route path="certification-form" element={<CertificationForm />} />
            <Route path="peer-validation" element={<PeerValidation />} />
          </Route>
          <Route path="/course/:id" element={<CourseDetail />} />




          {/* Route 404 */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
