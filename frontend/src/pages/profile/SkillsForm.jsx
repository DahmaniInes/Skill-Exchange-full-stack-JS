import { useState } from "react";

const SkillsForm = ({ userData, setUserData }) => {
  const [skills, setSkills] = useState(userData.skills || []);

  const handleChange = (index, event) => {
    const { name, value } = event.target;
    const updatedSkills = [...skills];
    updatedSkills[index][name] = value;
    setSkills(updatedSkills);
    setUserData((prevData) => ({ ...prevData, skills: updatedSkills }));
  };

  const addSkill = () => {
    setSkills([...skills, { name: "", level: "Beginner", yearsOfExperience: 0 }]);
  };

  return (
    <div>
      <h3>Skills</h3>
      {skills.map((skill, index) => (
        <div key={index}>
          <label>Skill Name:</label>
          <input type="text" name="name" value={skill.name} onChange={(e) => handleChange(index, e)} />

          <label>Level:</label>
          <select name="level" value={skill.level} onChange={(e) => handleChange(index, e)}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <label>Years of Experience:</label>
          <input type="number" name="yearsOfExperience" value={skill.yearsOfExperience} onChange={(e) => handleChange(index, e)} />
        </div>
      ))}
      <button onClick={addSkill}>Add Skill</button>
    </div>
  );
};

export default SkillsForm;
