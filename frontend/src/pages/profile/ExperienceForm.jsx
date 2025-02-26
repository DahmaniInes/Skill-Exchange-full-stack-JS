import { useState } from "react";

const ExperienceForm = ({ userData, setUserData }) => {
  const [experience, setExperience] = useState(userData.experience || []);

  const handleChange = (index, event) => {
    const { name, value } = event.target;
    const updatedExperience = [...experience];
    updatedExperience[index][name] = value;
    setExperience(updatedExperience);
    setUserData((prevData) => ({ ...prevData, experience: updatedExperience }));
  };

  const addExperience = () => {
    setExperience([...experience, { title: "", company: "", startDate: "", endDate: "", description: "" }]);
  };

  return (
    <div>
      <h3>Work Experience</h3>
      {experience.map((exp, index) => (
        <div key={index}>
          <label>Job Title:</label>
          <input type="text" name="title" value={exp.title} onChange={(e) => handleChange(index, e)} />

          <label>Company:</label>
          <input type="text" name="company" value={exp.company} onChange={(e) => handleChange(index, e)} />

          <label>Start Date:</label>
          <input type="date" name="startDate" value={exp.startDate} onChange={(e) => handleChange(index, e)} />

          <label>End Date:</label>
          <input type="date" name="endDate" value={exp.endDate} onChange={(e) => handleChange(index, e)} />

          <label>Description:</label>
          <textarea name="description" value={exp.description} onChange={(e) => handleChange(index, e)} />
        </div>
      ))}
      <button onClick={addExperience}>Add Experience</button>
    </div>
  );
};

export default ExperienceForm;
