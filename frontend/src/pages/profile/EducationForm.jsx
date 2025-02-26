import { useState } from "react";

const EducationForm = ({ userData, setUserData }) => {
  const [education, setEducation] = useState(userData.education || []);

  const handleChange = (index, event) => {
    const { name, value } = event.target;
    const updatedEducation = [...education];
    updatedEducation[index][name] = value;
    setEducation(updatedEducation);
    setUserData((prevData) => ({ ...prevData, education: updatedEducation }));
  };

  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }]);
  };

  return (
    <div>
      <h3>Education</h3>
      {education.map((edu, index) => (
        <div key={index}>
          <label>School:</label>
          <input type="text" name="school" value={edu.school} onChange={(e) => handleChange(index, e)} />

          <label>Degree:</label>
          <input type="text" name="degree" value={edu.degree} onChange={(e) => handleChange(index, e)} />

          <label>Field of Study:</label>
          <input type="text" name="fieldOfStudy" value={edu.fieldOfStudy} onChange={(e) => handleChange(index, e)} />

          <label>Start Date:</label>
          <input type="date" name="startDate" value={edu.startDate} onChange={(e) => handleChange(index, e)} />

          <label>End Date:</label>
          <input type="date" name="endDate" value={edu.endDate} onChange={(e) => handleChange(index, e)} />
        </div>
      ))}
      <button onClick={addEducation}>Add Education</button>
    </div>
  );
};

export default EducationForm;
