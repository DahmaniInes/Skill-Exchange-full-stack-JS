
const FormProgress = ({ step, totalSteps, setStep }) => {
  return (
    <div className="form-progress">
      {[...Array(totalSteps)].map((_, index) => (
        <div 
          key={index} 
          className={`progress-step ${index + 1 <= step ? 'active' : ''}`}
          onClick={() => setStep(index + 1)}
        />
      ))}
    </div>
  );
};

export default FormProgress;