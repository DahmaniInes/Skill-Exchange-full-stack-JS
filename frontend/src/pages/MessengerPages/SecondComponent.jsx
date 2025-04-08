import React, { useState, useRef, useContext, useEffect } from 'react';
import axios from 'axios';
import './SecondComponantStyles.css';
import { ConversationContext } from './ConversationContext';

function SecondComponent({ conversation: initialConversation, otherParticipant }) {
  const { currentConversation } = useContext(ConversationContext);
  const conversation = currentConversation || initialConversation;
  const defaultProfileImage = 'https://static.vecteezy.com/ti/vecteur-libre/p1/5194103-icone-de-personnes-conception-plate-de-symbole-de-personnes-sur-un-fond-blanc-gratuit-vectoriel.jpg';
  const defaultName = 'Groupe sans nom';
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          console.error('Aucun token JWT trouvé');
          return;
        }
        const response = await axios.get('http://localhost:5000/MessengerRoute/currentUser', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(response.data._id);
      } catch (error) {
        console.error('Erreur lors de la récupération de l’utilisateur connecté:', error);
      }
    };
    fetchCurrentUser();
    console.log('Conversation actuelle:', conversation);
  }, [conversation]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('Aucun token JWT trouvé dans localStorage');
        alert('Vous devez être connecté pour ajouter des utilisateurs');
        return;
      }

      if (!conversation) {
        console.error('Aucune conversation sélectionnée');
        alert('Veuillez sélectionner une conversation');
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
      console.log('Utilisateurs disponibles à ajouter :', filteredUsers);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      alert('Impossible de charger la liste des utilisateurs');
    }
  };

  const handleAddUser = async (userToAdd) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('Aucun token JWT trouvé');
        alert('Vous devez être connecté pour effectuer cette action');
        return;
      }

      if (!conversation || !conversation._id) {
        console.error('Conversation non définie ou sans ID');
        alert('Erreur : Aucune conversation sélectionnée');
        return;
      }

      console.log('Données envoyées :', {
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
        console.log(`${userToAdd.firstName} ${userToAdd.lastName} ajouté avec succès`);
        alert(
          conversation.isGroup
            ? `${userToAdd.firstName} ${userToAdd.lastName} a été ajouté au groupe`
            : `Nouveau groupe créé avec ${userToAdd.firstName} ${userToAdd.lastName}`
        );
      } else {
        console.error('Échec de l’ajout:', response.data.message);
        alert('Échec de l’ajout: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erreur lors de l’ajout de l’utilisateur:', error);
      alert('Une erreur est survenue lors de l’ajout');
    }
  };

  const handleDeleteConversation = async () => {
    try {
      if (!conversation?._id) {
        console.error('Aucune conversation sélectionnée pour suppression');
        alert('Aucune conversation sélectionnée');
        return;
      }

      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.')) {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.delete('http://localhost:5000/MessengerRoute/deleteConversationForUser', {
          params: { conversationId: conversation._id },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          console.log('Conversation supprimée avec succès');
          alert('Conversation supprimée avec succès (uniquement pour vous)');
          window.location.reload();
        } else {
          console.error('Échec de la suppression:', response.data.message);
          alert('Échec de la suppression: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      alert('Une erreur est survenue lors de la suppression');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      if (!conversation?._id) {
        console.error('Aucune conversation sélectionnée pour quitter');
        alert('Aucune conversation sélectionnée');
        return;
      }

      if (window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ? Vous ne pourrez plus envoyer de messages.')) {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.post(
          'http://localhost:5000/MessengerRoute/leaveGroupConversation',
          { conversationId: conversation._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          console.log('Groupe quitté avec succès');
          alert('Vous avez quitté le groupe avec succès');
          window.location.reload();
        } else {
          console.error('Échec de l’abandon du groupe:', response.data.message);
          alert('Échec de l’abandon du groupe: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l’abandon du groupe:', error);
      alert('Une erreur est survenue lors de l’abandon du groupe');
    }
  };

  const handleBlockUser = async () => {
    try {
      if (!conversation?._id || !otherParticipant?._id) {
        console.error('Conversation ou participant non défini');
        alert('Erreur : Conversation ou participant non sélectionné');
        return;
      }

      if (window.confirm(`Êtes-vous sûr de vouloir bloquer ${otherParticipant.firstName} ${otherParticipant.lastName} ?`)) {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.post(
          'http://localhost:5000/MessengerRoute/blockUser',
          { conversationId: conversation._id, blockedUserId: otherParticipant._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          console.log('Utilisateur bloqué avec succès');
          alert('Utilisateur bloqué avec succès');
          window.location.reload();
        } else {
          console.error('Échec du blocage:', response.data.message);
          alert('Échec du blocage: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Erreur lors du blocage de l’utilisateur:', error);
      alert('Une erreur est survenue lors du blocage');
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
        alert('Veuillez sélectionner une photo');
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
        console.log('Photo du groupe mise à jour avec succès');
        alert('Photo du groupe mise à jour avec succès');
      } else {
        console.error('Échec de la mise à jour de la photo:', response.data.message);
        alert('Échec de la mise à jour de la photo: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo:', error);
      alert('Une erreur est survenue lors de la mise à jour de la photo');
    }
  };

  const handleSaveName = async () => {
    try {
      if (!newGroupName.trim()) {
        alert('Veuillez entrer un nom pour le groupe');
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
        console.log('Nom du groupe mis à jour avec succès');
        alert('Nom du groupe mis à jour avec succès');
      } else {
        console.error('Échec de la mise à jour du nom:', response.data.message);
        alert('Échec de la mise à jour du nom: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom:', error);
      alert('Une erreur est survenue lors de la mise à jour du nom');
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
      console.error('Aucune donnée de participants disponible');
      alert('Aucune donnée de participants disponible');
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
            <p>Aucun utilisateur sélectionné</p>
          </div>
        )
      ) : (
        <div className="user-header">
          <p>Aucun utilisateur sélectionné</p>
        </div>
      )}

      <div className="menu-options">
        <div className="menu-item">
          <span className="menu-icon">👤</span>
          <span>Voir le profil</span>
        </div>
        {conversation?.isGroup ? (
          <>
            <div className="menu-item" onClick={() => setShowEditPhotoPopup(true)}>
              <span className="menu-icon">📸</span>
              <span>Modifier la photo du groupe</span>
            </div>
            <div className="menu-item" onClick={() => setShowEditNamePopup(true)}>
              <span className="menu-icon">✏️</span>
              <span>Modifier le nom du groupe</span>
            </div>
            <div className="menu-item" onClick={fetchUsers}>
              <span className="menu-icon">👥</span>
              <span>Ajouter un utilisateur</span>
            </div>
            <div className="menu-item" onClick={handleShowParticipants}>
              <span className="menu-icon">👥</span>
              <span>Afficher tous les participants</span>
            </div>
            <div className="menu-item warning" onClick={handleLeaveGroup}>
              <span className="menu-icon">🚪</span>
              <span>Quitter la conversation</span>
            </div>
          </>
        ) : (
          <>
            <div className="menu-item" onClick={fetchUsers}>
              <span className="menu-icon">👥</span>
              <span>Ajouter une personne</span>
            </div>
            <div className="menu-item" onClick={handleBlockUser}>
              <span className="menu-icon">🚫</span>
              <span>Bloquer</span>
            </div>
          </>
        )}
        <div className="menu-item">
          <span className="menu-icon">🔔</span>
          <span>Mettre la conversation en sourdine</span>
        </div>
        <div className="menu-item warning" onClick={handleDeleteConversation}>
          <span className="menu-icon">🗑️</span>
          <span>Supprimer la conversation</span>
        </div>
      </div>

      {showEditPhotoPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Modifier la photo du groupe</h3>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button onClick={() => fileInputRef.current.click()}>Choisir une photo</button>
            {newGroupPhoto && (
              <img src={newGroupPhoto} alt="Aperçu" style={{ maxWidth: '100px', marginTop: '10px' }} />
            )}
            <div className="popup-buttons">
              <button onClick={handleSavePhoto} className="apply-btn">Appliquer</button>
              <button onClick={handleCancelPhotoChange} className="cancel-btn">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showEditNamePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Modifier le nom du groupe</h3>
            <div className="popup-input-group">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nouveau nom du groupe"
              />
            </div>
            <div className="popup-buttons">
              <button onClick={handleSaveName} className="apply-btn">Appliquer</button>
              <button onClick={handleCancelNameChange} className="cancel-btn">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showAddUserPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>{conversation.isGroup ? 'Ajouter un utilisateur' : 'Ajouter une personne'}</h3>
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
              <p className="no-users">Aucun utilisateur disponible à ajouter</p>
            )}
            <div className="popup-buttons">
              <button onClick={() => setShowAddUserPopup(false)} className="cancel-btn">Fermer</button>
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
              <p className="no-users">Aucun autre participant dans cette conversation</p>
            )}
            <div className="popup-buttons">
              <button onClick={() => setShowParticipantsPopup(false)} className="cancel-btn">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <div className="warning-section">
        <div className="warning-message">
          <p>Il y a un problème</p>
          <div className="rating-feedback">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="star">★</span>
              ))}
            </div>
            <p>Donnez votre avis et signalez la conversation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecondComponent;