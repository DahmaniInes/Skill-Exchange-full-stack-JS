import React, { useState, useRef, useContext, useEffect } from 'react';
import axios from 'axios';
import './SecondComponantStyles.css';
import { ConversationContext } from './ConversationContext';

function SecondComponent({ conversation: initialConversation, otherParticipant: propOtherParticipant }) {
  const { currentConversation } = useContext(ConversationContext);
  const conversation = currentConversation || initialConversation;
  const defaultProfileImage = 'https://static.vecteezy.com/ti/vecteur-libre/p1/5194103-icone-de-personnes-conception-plate-de-symbole-de-personnes-sur-un-fond-blanc-gratuit-vectoriel.jpg';
  const defaultName = 'Unnamed Group';
  const defaultProfileImagePersonne = 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png';

  const [showAddUserPopup, setShowAddUserPopup] = useState(false);
  const [showParticipantsPopup, setShowParticipantsPopup] = useState(false);
  const [users, setUsers] = useState([]);
  const [showEditPhotoPopup, setShowEditPhotoPopup] = useState(false);
  const [showEditNamePopup, setShowEditNamePopup] = useState(false);
  const [newGroupPhoto, setNewGroupPhoto] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showCustomReasonPopup, setShowCustomReasonPopup] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [ratings, setRatings] = useState({
    explains_well: 0,
    availability: 0,
    responsiveness: 0,
  });
  const [derivedOtherParticipant, setDerivedOtherParticipant] = useState(null);
  const fileInputRef = useRef(null);

  const reportCauses = [
    'Harassment',
    'Suicide or Self-Harm',
    'Impersonation',
    'Violence or Dangerous Organizations',
    'Nudity or Sexual Acts',
    'Scam or Fraud',
    'Spam',
    'Other',
  ];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          console.error('No JWT token found');
          return;
        }
        const response = await axios.get('http://localhost:5000/MessengerRoute/currentUser', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(response.data._id);

        if (!propOtherParticipant && conversation && !conversation.isGroup && conversation.participants) {
          const other = conversation.participants.find(
            (p) => p._id.toString() !== response.data._id
          );
          setDerivedOtherParticipant(other || null);
          console.log('Derived otherParticipant:', other);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
    console.log('Current conversation:', conversation);
    console.log('Prop otherParticipant:', propOtherParticipant);
  }, [conversation, propOtherParticipant]);

  const otherParticipant = propOtherParticipant || derivedOtherParticipant;

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('No JWT token found in localStorage');
        alert('You must be logged in to add users');
        return;
      }

      if (!conversation) {
        console.error('No conversation selected');
        alert('Please select a conversation');
        return;
      }

      const response = await axios.get('http://localhost:5000/MessengerRoute/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentParticipantIds = conversation.participants.map((p) => p._id.toString());
      const filteredUsers = response.data.data.filter(
        (user) => !currentParticipantIds.includes(user._id.toString())
      );
      setUsers(filteredUsers);
      setShowAddUserPopup(true);
      console.log('Available users to add:', filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Unable to load the user list');
    }
  };

  const handleRatingChange = (criterion, score) => {
    setRatings((prev) => ({ ...prev, [criterion]: score }));
  };

  const handleSubmitRating = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('No JWT token found');
        alert('You must be logged in to submit a rating');
        return;
      }

      const ratingData = Object.entries(ratings).map(([criterion, score]) => ({
        criterion,
        score,
      })).filter((r) => r.score > 0);

      if (ratingData.length === 0) {
        alert('Please assign at least one rating');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/MessengerRoute/rateTeacher',
        {
          conversationId: conversation._id,
          teacherId: otherParticipant._id,
          ratings: ratingData,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        console.log('Rating submitted successfully');
        alert('Rating submitted successfully');
        setShowRatingPopup(false);
        setRatings({ explains_well: 0, availability: 0, responsiveness: 0 });
      } else {
        console.error('Rating submission failed:', response.data.message);
        alert('Rating submission failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('An error occurred while submitting the rating');
    }
  };

  const renderStars = (criterion, currentScore) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= currentScore ? 'filled' : ''}`}
            onClick={() => handleRatingChange(criterion, star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleAddUser = async (userToAdd) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('No JWT token found');
        alert('You must be logged in to perform this action');
        return;
      }

      if (!conversation || !conversation._id) {
        console.error('Conversation undefined or missing ID');
        alert('Error: No conversation selected');
        return;
      }

      console.log('Data sent:', {
        conversationId: conversation._id,
        newUserId: userToAdd._id,
        isGroup: conversation.isGroup,
      });

      let response;
      if (conversation.isGroup) {
        response = await axios.put(
          'http://localhost:5000/MessengerRoute/addParticipantToGroup',
          { conversationId: conversation._id, userId: userToAdd._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/MessengerRoute/createGroupFromConversation',
          { conversationId: conversation._id, newUserId: userToAdd._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        setShowAddUserPopup(false);
        console.log(`${userToAdd.firstName} ${userToAdd.lastName} added successfully`);
        alert(
          conversation.isGroup
            ? `${userToAdd.firstName} ${userToAdd.lastName} has been added to the group`
            : `New group created with ${userToAdd.firstName} ${userToAdd.lastName}`
        );
      } else {
        console.error('Add failed:', response.data.message);
        alert('Add failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('An error occurred while adding the user');
    }
  };

  const handleDeleteConversation = async () => {
    try {
      if (!conversation?._id) {
        console.error('No conversation selected for deletion');
        alert('No conversation selected');
        return;
      }

      if (window.confirm('Are you sure you want to delete this conversation? This action is irreversible.')) {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.delete('http://localhost:5000/MessengerRoute/deleteConversationForUser', {
          params: { conversationId: conversation._id },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          console.log('Conversation deleted successfully');
          alert('Conversation deleted successfully (for you only)');
          window.location.reload();
        } else {
          console.error('Deletion failed:', response.data.message);
          alert('Deletion failed: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('An error occurred while deleting the conversation');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      if (!conversation?._id) {
        console.error('No conversation selected to leave');
        alert('No conversation selected');
        return;
      }

      if (window.confirm('Are you sure you want to leave this group? You will no longer be able to send messages.')) {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.post(
          'http://localhost:5000/MessengerRoute/leaveGroupConversation',
          { conversationId: conversation._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          console.log('Group left successfully');
          alert('You have successfully left the group');
          window.location.reload();
        } else {
          console.error('Failed to leave group:', response.data.message);
          alert('Failed to leave group: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('An error occurred while leaving the group');
    }
  };

  const handleBlockUser = async () => {
    try {
      if (!conversation?._id || !otherParticipant?._id) {
        console.error('Conversation or participant undefined');
        alert('Error: Conversation or participant not selected');
        return;
      }

      if (window.confirm(`Are you sure you want to block ${otherParticipant.firstName} ${otherParticipant.lastName}?`)) {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.post(
          'http://localhost:5000/MessengerRoute/blockUser',
          { conversationId: conversation._id, blockedUserId: otherParticipant._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          console.log('User blocked successfully');
          alert('User blocked successfully');
          window.location.reload();
        } else {
          console.error('Block failed:', response.data.message);
          alert('Block failed: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('An error occurred while blocking the user');
    }
  };

  const handleReportUser = async (reason) => {
    try {
      if (!conversation?._id || !otherParticipant?._id) {
        console.error('Conversation or participant undefined');
        alert('Error: Conversation or participant not selected');
        return;
      }

      if (!reason.trim()) {
        alert('Please select or enter a reason for the report');
        return;
      }

      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        'http://localhost:5000/MessengerRoute/reportUser',
        {
          conversationId: conversation._id,
          reportedUserId: otherParticipant._id,
          reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        console.log('User reported successfully');
        alert('User reported successfully');
        setShowReportPopup(false);
        setShowCustomReasonPopup(false);
        setReportReason('');
      } else {
        console.error('Report failed:', response.data.message);
        alert('Report failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      alert('An error occurred while reporting the user');
    }
  };

  const handleCauseClick = (cause) => {
    if (cause === 'Other') {
      setShowReportPopup(false);
      setShowCustomReasonPopup(true);
    } else {
      handleReportUser(cause);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewGroupPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('jwtToken');
    const response = await axios.post('http://localhost:5000/MessengerRoute/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  };

  const handleSavePhoto = async () => {
    try {
      if (!selectedFile) {
        alert('Please select a photo');
        return;
      }

      const uploadedUrl = await uploadFileToServer(selectedFile);
      const token = localStorage.getItem('jwtToken');
      const response = await axios.put(
        'http://localhost:5000/MessengerRoute/updateGroupPhoto',
        { conversationId: conversation._id, groupPhoto: uploadedUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowEditPhotoPopup(false);
        setSelectedFile(null);
        setNewGroupPhoto('');
        console.log('Group photo updated successfully');
        alert('Group photo updated successfully');
      } else {
        console.error('Failed to update photo:', response.data.message);
        alert('Failed to update photo: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('An error occurred while updating the photo');
    }
  };

  const handleSaveName = async () => {
    try {
      if (!newGroupName.trim()) {
        alert('Please enter a group name');
        return;
      }

      const token = localStorage.getItem('jwtToken');
      const response = await axios.put(
        'http://localhost:5000/MessengerRoute/updateGroupName',
        { conversationId: conversation._id, groupName: newGroupName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowEditNamePopup(false);
        setNewGroupName('');
        console.log('Group name updated successfully');
        alert('Group name updated successfully');
      } else {
        console.error('Failed to update name:', response.data.message);
        alert('Failed to update name: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating name:', error);
      alert('An error occurred while updating the name');
    }
  };

  const handleCancelPhotoChange = () => {
    setShowEditPhotoPopup(false);
    setNewGroupPhoto('');
    setSelectedFile(null);
  };

  const handleCancelNameChange = () => {
    setShowEditNamePopup(false);
    setNewGroupName('');
  };

  const handleShowParticipants = () => {
    if (!conversation?.participants) {
      console.error('No participant data available');
      alert('No participant data available');
      return;
    }
    setShowParticipantsPopup(true);
  };

  return (
    <div className="second-component">
      {conversation ? (
        conversation.isGroup ? (
          <div className="user-header">
            <img
              src={conversation.image || defaultProfileImage}
              alt={conversation.name || defaultName}
              className="user-profile-image"
            />
            <h2 className="user-full-name">{conversation.name || defaultName}</h2>
          </div>
        ) : otherParticipant ? (
          <div className="user-header">
            <img
              src={otherParticipant.profilePicture || defaultProfileImage}
              alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
              className="user-profile-image"
            />
            <h2 className="user-full-name">
              {otherParticipant.firstName} {otherParticipant.lastName}
            </h2>
          </div>
        ) : (
          <div className="user-header">
            <p>No user selected</p>
          </div>
        )
      ) : (
        <div className="user-header">
          <p>No user selected</p>
        </div>
      )}

      <div className="menu-options">
        {!conversation?.isGroup && (
          <div className="menu-item">
            <span className="menu-icon">👤</span>
            <span>View profile</span>
          </div>
        )}

        {conversation?.isGroup ? (
          <>
            <div className="menu-item" onClick={() => setShowEditPhotoPopup(true)}>
              <span className="menu-icon">📸</span>
              <span>Edit group photo</span>
            </div>
            <div className="menu-item" onClick={() => setShowEditNamePopup(true)}>
              <span className="menu-icon">✏️</span>
              <span>Edit group name</span>
            </div>
            <div className="menu-item" onClick={fetchUsers}>
              <span className="menu-icon">👥</span>
              <span>Add a user</span>
            </div>
            <div className="menu-item" onClick={handleShowParticipants}>
              <span className="menu-icon">👥</span>
              <span>View all participants</span>
            </div>
            <div className="menu-item warning" onClick={handleLeaveGroup}>
              <span className="menu-icon">🚪</span>
              <span>Leave conversation</span>
            </div>
          </>
        ) : (
          <>
            <div className="menu-item" onClick={fetchUsers}>
              <span className="menu-icon">👥</span>
              <span>Add a person</span>
            </div>
            {otherParticipant && otherParticipant.role === 'teacher' && (
              <div className="menu-item" onClick={() => setShowRatingPopup(true)}>
                <span className="menu-icon">⭐</span>
                <span>Rate this teacher</span>
              </div>
            )}
            <div className="menu-item" onClick={handleBlockUser}>
              <span className="menu-icon">🚫</span>
              <span>Block</span>
            </div>
            <div className="menu-item" onClick={() => setShowReportPopup(true)}>
              <span className="menu-icon">⚠️</span>
              <span>Report</span>
            </div>
          </>
        )}
        <div className="menu-item warning" onClick={handleDeleteConversation}>
          <span className="menu-icon">🗑️</span>
          <span>Delete conversation</span>
        </div>
      </div>

      {showEditPhotoPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Edit group photo</h3>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button onClick={() => fileInputRef.current.click()}>Choose a photo</button>
            {newGroupPhoto && (
              <img src={newGroupPhoto} alt="Preview" style={{ maxWidth: '100px', marginTop: '10px' }} />
            )}
            <div className="popup-buttons">
              <button onClick={handleSavePhoto} className="apply-btn">Apply</button>
              <button onClick={handleCancelPhotoChange} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditNamePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Edit group name</h3>
            <div className="popup-input-group">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name"
              />
            </div>
            <div className="popup-buttons">
              <button onClick={handleSaveName} className="apply-btn">Apply</button>
              <button onClick={handleCancelNameChange} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddUserPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>{conversation.isGroup ? 'Add a user' : 'Add a person'}</h3>
            {users.length > 0 ? (
              <div className="user-list">
                {users.map((user) => (
                  <div key={user._id} className="user-item" onClick={() => handleAddUser(user)}>
                    <img
                      src={user.profilePicture || defaultProfileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="user-menu-image"
                    />
                    <span className="user-menu-name">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="add-icon">➕</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-users">No users available to add</p>
            )}
            <div className="popup-buttons">
              <button onClick={() => setShowAddUserPopup(false)} className="cancel-btn">Close</button>
            </div>
          </div>
        </div>
      )}

      {showParticipantsPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Participants</h3>
            {conversation.participants.length > 0 ? (
              <div className="user-list">
                {conversation.participants
                  .filter((participant) => participant._id.toString() !== currentUserId)
                  .map((participant) => (
                    <div key={participant._id} className="user-item">
                      <img
                        src={participant.profilePicture || defaultProfileImagePersonne}
                        alt={`${participant.firstName} ${participant.lastName}`}
                        className="user-menu-image"
                      />
                      <span className="user-menu-name">
                        {participant.firstName} {participant.lastName}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="no-users">No other participants in this conversation</p>
            )}
            <div className="popup-buttons">
              <button onClick={() => setShowParticipantsPopup(false)} className="cancel-btn">Close</button>
            </div>
          </div>
        </div>
      )}

      {showReportPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Report {otherParticipant?.firstName} {otherParticipant?.lastName}</h3>
            <div className="report-causes">
              {reportCauses.map((cause, index) => (
                <div
                  key={index}
                  className="report-cause-item"
                  onClick={() => handleCauseClick(cause)}
                >
                  {cause}
                </div>
              ))}
            </div>
            <div className="popup-buttons">
              <button onClick={() => setShowReportPopup(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCustomReasonPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Report - Other</h3>
            <div className="popup-input-group">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Enter the reason for the report"
                rows="4"
                style={{ width: '100%' }}
              />
            </div>
            <div className="popup-buttons">
              <button onClick={() => handleReportUser(reportReason)} className="apply-btn">Report</button>
              <button
                onClick={() => {
                  setShowCustomReasonPopup(false);
                  setReportReason('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Rate {otherParticipant?.firstName} {otherParticipant?.lastName}</h3>
            <div className="rating-criteria">
              <div className="criterion">
                <span>Explains well</span>
                {renderStars('explains_well', ratings.explains_well)}
              </div>
              <div className="criterion">
                <span>Availability</span>
                {renderStars('availability', ratings.availability)}
              </div>
              <div className="criterion">
                <span>Responsiveness</span>
                {renderStars('responsiveness', ratings.responsiveness)}
              </div>
            </div>
            <div className="popup-buttons">
              <button onClick={handleSubmitRating} className="apply-btn">Submit</button>
              <button
                onClick={() => {
                  setShowRatingPopup(false);
                  setRatings({ explains_well: 0, availability: 0, responsiveness: 0 });
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecondComponent;