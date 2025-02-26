import { useState } from "react";

const UserDetailsForm = ({ userData, setUserData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div>
      <h3>User Details</h3>
      <label>First Name:</label>
      <input type="text" name="firstName" value={userData.firstName} onChange={handleChange} />

      <label>Last Name:</label>
      <input type="text" name="lastName" value={userData.lastName} onChange={handleChange} />

      <label>Email:</label>
      <input type="email" name="email" value={userData.email} onChange={handleChange} disabled />

      <label>Phone:</label>
      <input type="tel" name="phone" value={userData.phone} onChange={handleChange} />

      <label>Bio:</label>
      <textarea name="bio" value={userData.bio} onChange={handleChange} />

      <label>Location:</label>
      <input type="text" name="location" value={userData.location} onChange={handleChange} />
    </div>
  );
};

export default UserDetailsForm;
