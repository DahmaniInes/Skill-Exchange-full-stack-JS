import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Contact from './pages/Contact';
import EditProfile from './pages/profile/editProfile';
import SecuritySettings from './pages/profile/securitySettings';
import UserProfile from './pages/profile/userProfile';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="contact" element={<Contact />} />
          <Route path="/editProfile" element={<EditProfile />} />
          <Route path="/SecuritySettings" element={<SecuritySettings />} />
          <Route path="/UserProfile" element={<UserProfile />} />
         
        </Route>
      </Routes>
    </BrowserRouter>
  );
}



/*useEffect(() => {
  // Initialiser WOW.js
  new WOW().init();
  
  // Initialiser OwlCarousel
  $('.owl-carousel').owlCarousel({
    // options
  });
  
  // ... autres initialisations
}, []);*/

export default App;