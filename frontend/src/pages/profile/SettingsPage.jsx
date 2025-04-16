import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProfileService from "../../services/ProfileService";
import "./SecuritySettings.css";

const SettingsPage = ({ 
  privacySettings = {
    isProfilePublic: false,
    isDiscoverable: false
  }, 
  notifications = {
    emailNotifications: true,
    pushNotifications: true,
    skillRequests: true
  }, 
  handleChange, 
  handleSubmit, 
  handleCancel, 
  prevStep 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Ensure handleChange is defined if not provided
  const safeHandleChange = handleChange || ((section, field, value) => {
    console.warn("handleChange not provided to SettingsPage component");
  });
  
  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update privacy settings
      await ProfileService.updatePrivacySettings(privacySettings);
      
      // Update notification preferences
      await ProfileService.updateNotificationPreferences(notifications);
      
      // Call the parent's handleSubmit if provided
      if (handleSubmit) {
        await handleSubmit();
      }
      
      // Show success notification
      if (window.toast) {
        window.toast.success("Settings saved successfully");
      }
      
      // Redirect to profile page after successful submission
      navigate("/profile");
      
    } catch (error) {
      console.error("Error updating settings:", error);
      
      // Show error notification
      if (window.toast) {
        window.toast.error("Failed to save settings. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel button click
  const onCancel = () => {
    if (handleCancel) {
      handleCancel();
    } else {
      // Default behavior: go back to previous page
      navigate(-1);
    }
  };
  
  return (
    <div className="settings-container">
      <h2 className="settings-heading">SETTINGS</h2>
      
      <form onSubmit={handleLocalSubmit}>
        <div className="settings-form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="profileVisibility">Profile Visibility</label>
            <select 
              id="profileVisibility"
              className="form-select"
              value={privacySettings.isProfilePublic ? "public" : "private"}
              onChange={(e) => 
                safeHandleChange("privacySettings", "isProfilePublic", e.target.value === "public")
              }
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="contactVisibility">Contact Info Visibility</label>
            <select 
              id="contactVisibility"
              className="form-select"
              value={privacySettings.isDiscoverable ? "visible" : "hidden"}
              onChange={(e) => 
                safeHandleChange("privacySettings", "isDiscoverable", e.target.value === "visible")
              }
            >
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          
          <div className="checkbox-group">
            <label className="form-label" htmlFor="emailNotifications">Email Notifications</label>
            <input 
              id="emailNotifications"
              type="checkbox" 
              className="custom-checkbox"
              checked={notifications.emailNotifications || false}
              onChange={(e) => 
                safeHandleChange("notifications", "emailNotifications", e.target.checked)
              }
            />
          </div>
          
          <div className="checkbox-group">
            <label className="form-label" htmlFor="pushNotifications">Push Notifications</label>
            <input 
              id="pushNotifications"
              type="checkbox" 
              className="custom-checkbox"
              checked={notifications.pushNotifications || false}
              onChange={(e) => 
                safeHandleChange("notifications", "pushNotifications", e.target.checked)
              }
            />
          </div>
          
          <div className="checkbox-group">
            <label className="form-label" htmlFor="skillRequests">Skill Opportunities</label>
            <input 
              id="skillRequests"
              type="checkbox" 
              className="custom-checkbox"
              checked={notifications.skillRequests || false}
              onChange={(e) => 
                safeHandleChange("notifications", "skillRequests", e.target.checked)
              }
            />
          </div>
        </div>
        
        <div className="button-group">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
          >
            ← Cancel
          </button>
          
          <button
            type="submit"
            className="save-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;