// src/App.jsx
import React from 'react';

import './index.css';


import Login from "./pages/login/login";
import Signup from "./pages/signup/SignUp";
    

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { WOW } from 'wowjs';

import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Contact from './pages/Contact';
import About from './pages/About';
import Courses from './pages/Courses';
import NotFound from './pages/NotFound';
//import "https://code.jquery.com/jquery-3.6.0.min.js";
//import "https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js";
import TotpStup from './pages/TotpSetup';

// Styles
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'font-awesome/css/font-awesome.min.css';
import 'animate.css';
import 'wowjs/css/libs/animate.css';

function App() {
  useEffect(() => {
    // Attendre que le DOM soit complètement chargé
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
          <Route path='/home' element={<Home />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="courses" element={<Courses />} />
          <Route path="/login" element={<Login />} />
         <Route path="/signup" element={<Signup />} />
         <Route path="/auth" element={<TotpStup />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
  );
}

export default App;
