import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="contact" element={<Contact />} />
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