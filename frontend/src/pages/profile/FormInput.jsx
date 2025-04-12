import React, { useState } from "react";

const FormInput = ({ 
  label, 
  type, 
  value, 
  fieldName, 
  handleChange, 
  placeholder, 
  icon, 
  required = false, 
  validation 
}) => {
  const [error, setError] = useState("");
  
  const validateInput = (value) => {
    if (required && !value.trim()) {
      return `${label} is required`;
    }
    
    if (validation && value) {
      return validation(value);
    }
    
    return "";
  };
  
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const errorMsg = validateInput(newValue);
    setError(errorMsg);
    
    // If handleChange is a function accepting two or three parameters
    if (typeof handleChange === 'function') {
      if (handleChange.length === 2) {
        handleChange(fieldName, newValue);
      } else if (handleChange.length === 3) {
        handleChange(fieldName, newValue, errorMsg);
      }
    }
  };
  
  return (
    <div className="form-group">
      <label className="form-label">
        {label} 
        {required && <span className="required-mark">*</span>}
      </label>
      <div className="input-wrapper">
        {icon && icon}
        <input
          type={type}
          className={`form-input ${icon ? "with-icon" : ""} ${error ? "input-error" : ""}`}
          value={value}
          onChange={handleInputChange}
          onBlur={() => setError(validateInput(value))}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormInput;