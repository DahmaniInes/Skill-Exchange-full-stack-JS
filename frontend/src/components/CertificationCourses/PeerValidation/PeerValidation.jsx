import React, { useState } from 'react';
import './PeerValidation.css';

const PeerValidation = () => {
  const [email, setEmail] = useState('');
  const [skill, setSkill] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ideally, send email and skill to backend for validation
    console.log('Peer validation request sent:', { email, skill });
    setMessage('Validation request sent successfully!');
    setEmail('');
    setSkill('');
  };

  return (
    <div className="peer-validation-card shadow p-4 rounded">
      <h2 className="text-center mb-4">Request Peer Validation</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Peer's Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="skill" className="form-label">Skill to Validate</label>
          <input
            type="text"
            className="form-control"
            id="skill"
            placeholder="e.g. JavaScript"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-success w-100">Send Validation Request</button>

        {message && <div className="alert alert-info mt-3">{message}</div>}
      </form>
    </div>
  );
};

export default PeerValidation;
