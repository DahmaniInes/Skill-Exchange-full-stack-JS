import { useState } from "react";

const PrivacySettingsForm = ({ userData, setUserData }) => {
  const [privacySettings, setPrivacySettings] = useState(userData.privacySettings || { isProfilePublic: true });

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setPrivacySettings((prevSettings) => ({ ...prevSettings, [name]: checked }));
    setUserData((prevData) => ({ ...prevData, privacySettings: { ...prevData.privacySettings, [name]: checked } }));
  };

  return (
    <div>
      <h3>Privacy Settings</h3>
      <label>
        <input type="checkbox" name="isProfilePublic" checked={privacySettings.isProfilePublic} onChange={handleChange} />
        Make Profile Public
      </label>
    </div>
  );
};

export default PrivacySettingsForm;
