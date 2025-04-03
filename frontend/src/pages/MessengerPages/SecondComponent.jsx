import React from 'react';
import './SecondComponantStyles.css';

function SecondComponent({ selectedUser }) {
    const defaultProfileImage = 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png'; // Image par défaut

    return (
        <div className="second-component">
            {/* Section de l'en-tête avec l'image et le nom/prénom */}
            {selectedUser ? (
                <div className="user-header">
                    <img
                        src={selectedUser.profilePicture || defaultProfileImage}
                        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                        className="user-profile-image"
                    />
                    <h2 className="user-full-name">
                        {selectedUser.firstName} {selectedUser.lastName}
                    </h2>
                </div>
            ) : (
                <div className="user-header">
                    <p>Aucun utilisateur sélectionné</p>
                </div>
            )}

            {/* Liste des options du menu */}
            <div className="menu-options">
                <div className="menu-item">
                    <span className="menu-icon">💬</span>
                    <span>Ouvrir dans Messenger</span>
                </div>
                <div className="menu-item">
                    <span className="menu-icon">👤</span>
                    <span>Voir le profil</span>
                </div>
                <div className="menu-item">
                    <span className="menu-icon">👥</span> {/* Icône pour "Ajouter une personne" */}
                    <span>Ajouter une personne à la conversation</span>
                </div>
                <div className="menu-item">
                    <span className="menu-icon">🔔</span>
                    <span>Mettre la conversation en sourdine</span>
                </div>
                <div className="menu-item">
                    <span className="menu-icon">❌</span>
                    <span>Ignorer les messages</span>
                </div>
                <div className="menu-item">
                    <span className="menu-icon">🚫</span>
                    <span>Bloquer</span>
                </div>
                <div className="menu-item warning">
                    <span className="menu-icon">🗑️</span>
                    <span>Supprimer la conversation</span>
                </div>
            </div>

            {/* Message d'avertissement */}
            <div className="warning-message">
                <p>Il y a un problème</p>
                <p>Donnez votre avis et signalez la conversation</p>
            </div>
        </div>
    );
}

export default SecondComponent;