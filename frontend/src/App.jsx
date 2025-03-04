import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Contact from './pages/Contact';
import ProfileForm from './pages/profile/ProfileForm'; // Ton composant de modification de profil // Exemple d'un autre composant
import SecuritySettings from './pages/profile/SecuritySettings'; // Exemple d'un autre composant
import Profile from './pages/profile/ProfilePage'; // Composant pour afficher le profil

// <Route path="profile" element={<Profile />} />*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route principale avec un layout général */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} /> {/* Page d'accueil */}
          <Route path="contact" element={<Contact />} /> {/* Page de contact */}
          
          {/* Autres routes sous le MainLayout */}
          <Route path="profileForm" element={<ProfileForm />} />
          <Route path="SecuritySettings" element={<SecuritySettings />} />
          <Route path="profile" element={<Profile />} />
       
        </Route>

      
      </Routes>
    </BrowserRouter>
  );
}

export default App;
