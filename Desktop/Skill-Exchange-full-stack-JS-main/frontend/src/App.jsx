import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MyProfile from "./components/pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/profile" element={<MyProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
