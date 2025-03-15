import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import bgImage from "../../assets/images/bg-sign-up-cover.jpeg";
import googleLogo from "../../assets/img/google-logo.png"; // Add this image to your assets
import githubLogo from "../../assets/img/github-logo.jpg"; // Add this image to your assets
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();



  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/users/login", {
        email,
        password,
      });
  
      
      // Save the JWT token in local storage
      const { user, token } = response.data;
      if (token) {
        localStorage.setItem("jwtToken", token);
        console.log("JWT Token saved:", token);
      } else {
        console.warn("JWT Token not found in response");
      }

      
  
      console.log("Login successful:", response.data);
      setMessage("Login successful! Redirecting...");
      setError('');
      if (!response.data.user.isTOTPEnabled) {
        // First login after registration, redirect to TOTP setup
        navigate("/auth");
      } else {
        // User already has TOTP set up, go to home page
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      setError("Login failed. Please check your email and password.");
      setMessage('');
    }
  };
  
  

  
  
  
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/login/auth/google";
  };
  
  const handleGithubLogin = () => {
    window.location.href = "http://localhost:5000/loginGit/auth/github";
  };
  
  return (
    <div className="signup-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="signup-content">
        <h2>Sign-In</h2>
        
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
          
          {/* Google OAuth button with logo */}
          <button 
            type="button" 
            className="oauth-button google-button"
            onClick={handleGoogleLogin}
          >
            <img src={googleLogo} alt="Google logo" />
            Sign in with Google
          </button>
          
          {/* GitHub OAuth button with logo */}
          <button 
            type="button" 
            className="oauth-button github-button"
            onClick={handleGithubLogin}
          >
            <img src={githubLogo} alt="GitHub logo" />
            Sign in with GitHub
          </button>
        </form>
        
        <p>Create account? <a href="/signup">Sign Up</a></p>
      </div>
    </div>
  );
};

export default Login;