import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import './SecondComponantStyles.css';
import { ConversationContext } from './ConversationContext';

function SecondComponent({ conversation: initialConversation, otherParticipant }) {
  const { currentConversation } = useContext(ConversationContext);
  const conversation = currentConversation || initialConversation;
  const defaultProfileImage = 'https://static.vecteezy.com/ti/vecteur-libre/p1/5194103-icone-de-personnes-conception-plate-de-symbole-de-personnes-sur-un-fond-blanc-gratuit-vectoriel.jpg';
  const defaultname = 'Groupe sans nom';

  const [showAddUserList, setShowAddUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [showEditPhotoPopup, setShowEditPhotoPopup] = useState(false);
  const [showEditNamePopup, setShowEditNamePopup] = useState(false);
  const [newGroupPhoto, setNewGroupPhoto] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('http://localhost:5000/MessengerRoute/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentParticipantIds = conversation.participants.map((p) => p._id);
      const filteredUsers = response.data.data.filter((user) => !currentParticipantIds.includes(user._id));
      setUsers(filteredUsers);
      setShowAddUserList(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      alert('Impossible de charger la liste des utilisateurs');
    }
  };

  const handleDeleteConversation = async () => {
    try {
      if (!conversation?._id) {
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
          alert('Conversation supprimée avec succès (uniquement pour vous)');
          window.location.reload();
        } else {
          alert('Échec de la suppression: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue lors de la suppression');
    }
  };

  const handleAddUser = async (userToAdd) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.put(
        'http://localhost:5000/MessengerRoute/addParticipantToGroup',
        { conversationId: conversation._id, userId: userToAdd._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowAddUserList(false);
        alert(`${userToAdd.firstName} ${userToAdd.lastName} a été ajouté au groupe`);
      } else {
        alert('Échec de lajout: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erreur lors de lajout de lutilisateur:', error);
      alert('Une erreur est survenue lors de lajout');
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
        alert('Photo du groupe mise à jour avec succès');
      } else {
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
        alert('Nom du groupe mis à jour avec succès');
      } else {
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

  return (
    <div className="second-component">
      {/* Section de l'en-tête avec l'image et le nom/prénom */}
      {conversation ? (
        conversation.isGroup ? (
          <div className="user-header">
            <img
              src={conversation.image || defaultProfileImage}
              alt={conversation.name || defaultname}
              className="user-profile-image"
            />
            <h2 className="user-full-name">
              {conversation.name || defaultname}
            </h2>
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

      {/* Liste des options du menu */}
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
          </>
        ) : (
          <div className="menu-item" onClick={fetchUsers}>
            <span className="menu-icon">👥</span>
            <span>Ajouter une personne</span>
          </div>
        )}
        <div className="menu-item">
          <span className="menu-icon">🔔</span>
          <span>Mettre la conversation en sourdine</span>
        </div>
        <div className="menu-item">
          <span className="menu-icon">🚫</span>
          <span>Bloquer</span>
        </div>
        <div className="menu-item warning" onClick={handleDeleteConversation}>
          <span className="menu-icon">🗑️</span>
          <span>Supprimer la conversation</span>
        </div>
      </div>

      {/* Popup pour modifier la photo du groupe */}
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

      {/* Popup pour modifier le nom du groupe */}
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

      {/* Menu des utilisateurs à ajouter */}
      {showAddUserList && (
        <div className="user-add-menu">
          <div className="user-add-header">
            <h3>Ajouter un utilisateur</h3>
            <span className="close-icon" onClick={() => setShowAddUserList(false)}>✖</span>
          </div>
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user._id} className="user-menu-item" onClick={() => handleAddUser(user)}>
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
            ))
          ) : (
            <p className="no-users">Aucun utilisateur disponible à ajouter</p>
          )}
        </div>
      )}

      {/* Message d'avertissement avec rating */}
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