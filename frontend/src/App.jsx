// src/App.jsx
import React, { useEffect } from 'react';
import axios from 'axios';

import './index.css';

import Login from "./pages/login/login";
import Signup from "./pages/signup/SignUp";

import { Routes, Route } from 'react-router-dom';
import { WOW } from 'wowjs';

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

import { ConversationProvider } from './pages/MessengerPages/ConversationContext';

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
        callback: function (box) {},
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
          <Route path="/home" element={<Home />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="courses" element={<Courses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth" element={<TotpStup />} />
          <Route path="profileForm" element={<ProfileForm />} />
          <Route path="SecuritySettings" element={<SecuritySettings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="MessengerPage" element={<MessengerPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ConversationProvider>
  );
}

export default App;