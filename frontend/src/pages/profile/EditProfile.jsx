import React, { useState } from "react";
import UserDetailsForm from "./UserDetailsForm";
import ExperienceForm from "./ExperienceForm";
import EducationForm from "./EducationForm";
import SkillsForm from "./SkillsForm";
import SocialLinksForm from "./SocialLinksForm";
import PrivacySettingsForm from "./PrivacySettingsForm";
import useFetchUserData from "./Hooks/useFetchUserData";
import useFormValidation from "./Hooks/useFormValidation";

const EditProfile = ({ userId }) => {
  const { data, loading } = useFetchUserData(userId);
  const { errors, validate } = useFormValidation();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  if (loading) return <p>Chargement...</p>;

  const steps = [
    <UserDetailsForm formData={formData} setFormData={setFormData} errors={errors} />,
    <ExperienceForm formData={formData} setFormData={setFormData} errors={errors} />,
    <EducationForm formData={formData} setFormData={setFormData} errors={errors} />,
    <SkillsForm formData={formData} setFormData={setFormData} errors={errors} />,
    <SocialLinksForm formData={formData} setFormData={setFormData} errors={errors} />,
    <PrivacySettingsForm formData={formData} setFormData={setFormData} errors={errors} />,
  ];

  const handleNext = () => {
    if (validate(formData)) {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  return (
    <div>
      <h2>Modifier le profil</h2>
      {steps[step]}
      <button onClick={() => setStep((prev) => Math.max(prev - 1, 0))}>Précédent</button>
      <button onClick={handleNext} disabled={!validate(formData)}>Suivant</button>
    </div>
  );
};

export default EditProfile;
