import React, { useState } from 'react';
import axios from 'axios';
import bgImage from "../../assets/images/bg-sign-up-cover.jpeg";
import './SignUp.css';

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!['student', 'teacher'].includes(role)) {
      setError('Please select a valid role (student or teacher).');
      setMessage('');
      return;
    }

    const userData = { firstName, lastName, email, password, role };

    try {
      const response = await axios.post("http://localhost:5000/api/signup", userData);
      setMessage(response.data.message);
      setError('');
      // Optionally, reset form here
    } catch (err) {
      setError(err.response?.data?.message || 'Error during sign-up');
      setMessage('');
    }
  };

  return (
    <div className="signup-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="signup-content">
        <h2>Welcome to the Sign-Up</h2>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
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

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            style={{ margin: "10px 0", padding: "12px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "16px", width: "100%" }}
          >
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <button type="submit">Sign Up</button>
        </form>

        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default SignUp;
