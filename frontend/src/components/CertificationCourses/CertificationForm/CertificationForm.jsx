import React, { useState } from 'react';
import './CertificationForm.css';

const CertificationForm = () => {
  const [formData, setFormData] = useState({
    skill: '',
    organization: '',
    issueDate: '',
    certificateUrl: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted data:', formData);
    // send data to backend or show a success message
  };

  return (
    <div className="cert-form-card shadow p-4 rounded">
      <h2 className="text-center mb-4">Add a Certification</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="skill" className="form-label">Skill Name</label>
          <input
            type="text"
            className="form-control"
            id="skill"
            name="skill"
            placeholder="e.g. React, Java"
            value={formData.skill}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="organization" className="form-label">Issuing Organization</label>
          <input
            type="text"
            className="form-control"
            id="organization"
            name="organization"
            placeholder="e.g. Coursera, Udemy"
            value={formData.organization}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="issueDate" className="form-label">Issue Date</label>
          <input
            type="date"
            className="form-control"
            id="issueDate"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="certificateUrl" className="form-label">Certificate URL</label>
          <input
            type="url"
            className="form-control"
            id="certificateUrl"
            name="certificateUrl"
            placeholder="https://..."
            value={formData.certificateUrl}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">Submit Certification</button>
      </form>
    </div>
  );
};

export default CertificationForm;
