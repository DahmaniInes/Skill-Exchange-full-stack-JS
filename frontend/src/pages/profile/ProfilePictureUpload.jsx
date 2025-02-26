import React from 'react';

const ProfilePictureUpload = ({ onNext }) => {
    return (
        <div className="profile-picture-upload">
            <h3>Upload Profile Picture</h3>
            <input type="file" accept="image/*" />
            <button className="next-button" onClick={onNext}>Next</button>
        </div>
    );
};

export default ProfilePictureUpload;    