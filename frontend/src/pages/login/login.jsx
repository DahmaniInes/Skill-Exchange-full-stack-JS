import React, { useState } from 'react';
import axios from 'axios';
import bgImage from "../../assets/images/bg-sign-up-cover.jpeg";
import './login.css'; // Ajoutez le style de votre formulaire dans ce fichier CSS

const Login = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/users/login", {
        email,
        password,
      });

      console.log("Login successful:", response.data);
      navigate("/dashboard"); // Redirect after successful login
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
    }
  };

  return (
    <div className="signup-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="signup-content">
        <h2>Welcome to the Sign-In</h2>

        {/* Afficher le message de succès ou d'erreur */}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {/* Formulaire d'inscription */}
        <form onSubmit={handleLogin}>
          
         
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>

        {/* Lien vers la page de connexion */}
        <p>Create account? <a href="/signup">Sign Up</a></p>
      </div>
    </div>
  );
};

export default Login;
