import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const SkillExchange = () => {
  return (
    <div className="container">
      <h1>Certification & Skill Exchange</h1>
      <nav style={{ marginBottom: '1rem' }}>
        <Link to="/skills">Skills</Link> |{" "}
        <Link to="/skills/certification-form">Certification Form</Link> |{" "}
        <Link to="/skills/peer-validation">Peer Validation</Link>
      </nav>
      <Outlet /> {/* This is where child routes will render */}
    </div>
  );
};

export default SkillExchange;
