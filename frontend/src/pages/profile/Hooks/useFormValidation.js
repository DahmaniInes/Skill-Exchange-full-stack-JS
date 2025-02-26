import { useState } from 'react';

const useFormValidation = () => {
    const [errors, setErrors] = useState({});

    const validate = (values) => {
        let newErrors = {};
        if (!values.name) newErrors.name = 'Name is required';
        if (!values.email) newErrors.email = 'Email is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return { errors, validate };
};

export default useFormValidation;