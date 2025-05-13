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
  validation,
  error: externalError
}) => {
  const [error, setError] = useState("");

  console.log(`FormInput - ${fieldName} - value:`, value);
  console.log(`FormInput - ${fieldName} - handleChange:`, handleChange);

  const validateInput = (value) => {
    console.log(`FormInput - ${fieldName} - Validating value:`, value); // Debug validation
    if (required && !value?.trim()) {
      return `${label} is required`;
    }
    
    if (validation && value) {
      return validation(value);
    }
    
    return "";
  };
  
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    console.log(`FormInput - ${fieldName} - New value:`, newValue);
    const errorMsg = validateInput(newValue);
    setError(errorMsg);

    if (typeof handleChange === 'function') {
      handleChange(fieldName, newValue);
    } else {
      console.error(`FormInput - ${fieldName} - handleChange is not a function`);
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
          className={`form-input ${icon ? "with-icon" : ""} ${(error || externalError) ? "input-error" : ""}`}
          value={value || ""}
          onChange={(e) => {
            console.log(`FormInput - ${fieldName} - onChange triggered`);
            handleInputChange(e);
          }}
          onBlur={() => {
            const errorMsg = validateInput(value);
            setError(errorMsg);
          }}
          onClick={() => console.log(`FormInput - ${fieldName} - Input clicked`)}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {(error || externalError) && <span className="error-message">{error || externalError}</span>}
    </div>
  );
};

export default FormInput;