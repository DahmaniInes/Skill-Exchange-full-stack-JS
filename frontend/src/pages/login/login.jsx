import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import bgImage from "../../assets/images/bg-sign-up-cover.jpeg";
import googleLogo from "../../assets/img/google-logo.png";
import githubLogo from "../../assets/img/github-logo.jpg";
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [useOtp, setUseOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (otpExpiresAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(otpExpiresAt) - new Date()) / 1000));
        setCountdown(remaining);
        if (remaining === 0) {
          setIsOtpSent(false);
          setOtpExpiresAt(null);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpExpiresAt]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/users/login", { email, password });
      const token = response.data.token;
      if (token) {
        localStorage.setItem("jwtToken", token);
      }
      setMessage("Login successful! Redirecting...");
      setError('');
      navigate("/home");
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Login failed. Please check your credentials.");
      setMessage('');
    }
  };

  const handleRequestOtp = async () => {
    try {
      const response = await axios.post("http://localhost:5000/users/request-otp", { email });
      const expiresAt = response.data.expiresAt || new Date(Date.now() + 5 * 60 * 1000); // fallback
      setOtpExpiresAt(expiresAt);
      setIsOtpSent(true);
      setMessage(response.data.message || "OTP sent to your email.");
      setError('');
    } catch (error) {
      console.error("OTP request failed:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to send OTP");
      setMessage('');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post("http://localhost:5000/users/login-otp", { email, otp });
      const token = response.data.token;
      if (token) {
        localStorage.setItem("jwtToken", token);
      }
      setMessage("OTP verified! Redirecting...");
      setError('');
      navigate("/home");
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || "OTP verification failed.";
  
      console.error("OTP verification error:", error);
  
      if (status === 403) {
        // Too many attempts — reset OTP form
        setIsOtpSent(false);
        setOtp('');
        setOtpExpiresAt(null);
        setCountdown(0);
        setUseOtp(false); 
        setError("Too many failed OTP attempts. Please try logging in again.");
      } else {
        setError(msg);
      }
  
      setMessage('');
    }
  };
  

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/login/auth/google";
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:5000/loginGit/auth/github";
  };

  const resetOtpState = () => {
    setOtp('');
    setIsOtpSent(false);
    setOtpExpiresAt(null);
    setCountdown(0);
    setMessage('');
    setError('');
  };

  return (
    <div className="signup-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="signup-content">
        <h2>Sign-In</h2>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form onSubmit={useOtp ? (e) => e.preventDefault() : handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              setMessage('');
            }}
            required
          />

          {useOtp ? (
            <>
              {isOtpSent ? (
                <>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow only digits and max 6 chars
                      if (/^\d{0,6}$/.test(val)) {
                        setOtp(val);
                        setError('');
                      }
                    }}
                    required
                    maxLength={6}
                  />

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6}
                    style={{ opacity: otp.length === 6 ? 1 : 0.6 }}
                  >
                    Verify OTP
                  </button>
                  <p style={{ fontSize: "14px", marginTop: "5px" }}>
                    {countdown > 0
                      ? `OTP expires in ${countdown} second${countdown !== 1 ? 's' : ''}`
                      : `OTP expired. Request a new one.`}
                  </p>
                </>
              ) : (
                <button type="button" onClick={handleRequestOtp}>Send OTP</button>
              )}
            </>
          ) : (
            <>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Login</button>
            </>
          )}

          <button
            type="button"
            className="oauth-button google-button"
            onClick={handleGoogleLogin}
          >
            <img src={googleLogo} alt="Google logo" />
            Sign in with Google
          </button>

          <button
            type="button"
            className="oauth-button github-button"
            onClick={handleGithubLogin}
          >
            <img src={githubLogo} alt="GitHub logo" />
            Sign in with GitHub
          </button>
        </form>

        <p
          onClick={() => {
            setUseOtp(!useOtp);
            resetOtpState();
          }}
          style={{ marginTop: "15px", color: "#06bbcc", cursor: "pointer", fontWeight: 500 }}
        >
          {useOtp ? "Use password instead" : "Use OTP instead"}
        </p>

        <p>Create account? <a href="/signup">Sign Up</a></p>
      </div>
    </div>
  );
};

export default Login;
