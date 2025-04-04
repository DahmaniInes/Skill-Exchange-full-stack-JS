import React from 'react';
import axios from 'axios';
import './SecondComponantStyles.css';

function SecondComponent({ conversation, otherParticipant }) {
    const defaultProfileImage = 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png';

    const handleDeleteConversation = async () => {
        if (!conversation?._id) {
            alert("Aucune conversation sélectionnée");
            return;
        }

        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.")) {
            try {
                const token = localStorage.getItem('jwtToken');
                
                const response = await axios.delete('http://localhost:5000/MessengerRoute/deleteConversationForUser', {
                    params: { conversationId: conversation._id },
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    alert("Conversation supprimée avec succès (uniquement pour vous)");
                    window.location.reload();
                } else {
                    alert("Échec de la suppression: " + response.data.message);
                }
            } catch (error) {
                console.error("Erreur lors de la suppression:", error);
                alert("Une erreur est survenue lors de la suppression");
            }
        }
    };  

    return (
        <div className="second-component">
            {/* Section de l'en-tête avec l'image et le nom/prénom */}
            {otherParticipant ? (
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
            )}

            {/* Liste des options du menu */}
            <div className="menu-options">
                <div className="menu-item">
                    <span className="menu-icon">👤</span>
                    <span>Voir le profil</span>
                </div>
                {!conversation?.isGroup && (
                    <div className="menu-item">
                        <span className="menu-icon">👥</span>
                        <span>Créer un groupe avec cette personne</span>
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