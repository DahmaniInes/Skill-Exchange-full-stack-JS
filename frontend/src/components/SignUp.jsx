import React, { useState } from 'react';
import axios from 'axios';
import bgImage from "../assets/images/bg-sign-up-cover.jpeg";
import './SignUp.css'; // Ajoutez le style de votre formulaire dans ce fichier CSS

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = { firstName, lastName, email, password };

    try {
      const response = await axios.post("http://localhost:5000/api/signup", userData);
      setMessage(response.data.message); // Affichez le message de succès
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error during sign-up');
      setMessage('');
    }
  };

  return (
    <div className="signup-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="signup-content">
        <h2>Welcome to the Sign-Up</h2>

        {/* Afficher le message de succès ou d'erreur */}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {/* Formulaire d'inscription */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
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
          <button type="submit">Sign Up</button>
        </form>

        {/* Lien vers la page de connexion */}
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default SignUp;
