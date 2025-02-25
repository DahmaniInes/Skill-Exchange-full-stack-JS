import logo from './logo.svg';
import './App.css';
import { Routes, Route } from "react-router-dom";
import Basic from "./layouts/authentication/sign-in/index";

function App() {
  return (
    <Routes>
      {/* Route for the sign-in page */}
      <Route path="/authentication/sign-in" element={<Basic />} />

     
      {/* Optionally, add more routes */}
    </Routes>
  );
}

export default App;
