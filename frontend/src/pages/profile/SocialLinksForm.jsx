import { useState } from "react";

const SocialLinksForm = ({ userData, setUserData }) => {
  const [socialLinks, setSocialLinks] = useState(userData.socialLinks || {});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSocialLinks((prevLinks) => ({ ...prevLinks, [name]: value }));
    setUserData((prevData) => ({ ...prevData, socialLinks: { ...prevData.socialLinks, [name]: value } }));
  };

  return (
    <div>
      <h3>Social Links</h3>
      <label>Portfolio:</label>
      <input type="url" name="portfolio" value={socialLinks.portfolio} onChange={handleChange} />

      <label>GitHub:</label>
      <input type="url" name="github" value={socialLinks.github} onChange={handleChange} />

      <label>LinkedIn:</label>
      <input type="url" name="linkedin" value={socialLinks.linkedin} onChange={handleChange} />

      <label>Twitter:</label>
      <input type="url" name="twitter" value={socialLinks.twitter} onChange={handleChange} />
    </div>
  );
};

export default SocialLinksForm;
