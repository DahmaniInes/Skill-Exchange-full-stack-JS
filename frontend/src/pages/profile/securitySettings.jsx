import React, { useState } from "react";
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaTimes } from "react-icons/fa";
import "./SecuritySettings.css";

const SecuritySettings = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState({ type: "", content: "" });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    const errors = [];

    if (!currentPassword) errors.push("Current password is required");
    if (newPassword.length < 8) errors.push("Password must be at least 8 characters");
    if (newPassword !== confirmPassword) errors.push("Passwords don't match");

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (errors.length > 0) {
      setMessage({ type: "error", content: errors[0] });
      return;
    }

    setMessage({ type: "success", content: "Password updated successfully!" });
  };

  const handleCancel = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setMessage({ type: "", content: "" });
  };

  return (
    <div className="security-container">
      <div className="security-header">
        <h2><FaLock /> Security Settings</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Current Password */}
        <div className="input-group">
          <label className="input-label">Current Password</label>
          <div className="input-wrapper">
            <input
              type={showPasswords.current ? "text" : "password"}
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => togglePasswordVisibility("current")}
              aria-label="Toggle password visibility"
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="input-group">
          <label className="input-label">New Password</label>
          <div className="input-wrapper">
            <input
              type={showPasswords.new ? "text" : "password"}
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => togglePasswordVisibility("new")}
              aria-label="Toggle password visibility"
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <div className="input-wrapper">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => togglePasswordVisibility("confirm")}
              aria-label="Toggle password visibility"
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message.content && (
          <div className={`message ${message.type}`}>
            {message.type === "success" ? <FaCheck /> : <FaTimes />}
            {message.content}
          </div>
        )}

        {/* Buttons */}
        <div className="button-group">
          <button type="submit" className="btn primary">Save Changes</button>
          <button type="button" className="btn secondary" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettings;