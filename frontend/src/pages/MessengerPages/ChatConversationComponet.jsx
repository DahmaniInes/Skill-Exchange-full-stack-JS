import React, { useState, useEffect, useRef } from 'react';
import './MessengerApplicationStyles.css';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import EmojiPicker from 'emoji-picker-react';

const ChatConversation = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId);
      } catch (error) {
        console.error('Error decoding JWT:', error);
      }
    }

    if (currentUserId) {
      socketRef.current = io('http://localhost:5000', {
        withCredentials: true,
        extraHeaders: {
          "Authorization": `Bearer ${token}`
        }
      });

      socketRef.current.emit('authenticate', currentUserId);

      if (selectedUser) {
        socketRef.current.emit('getMessages', {
          userId: currentUserId,
          otherUserId: selectedUser._id
        });
      }

      socketRef.current.on('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.on('messageHistory', (history) => {
        setMessages(history);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopRecording(); // Nettoyer l'enregistrement si actif
    };
  }, [selectedUser, currentUserId]);


  


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };






// Dans le composant, ajoutez ces états
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [cursorPosition, setCursorPosition] = useState(0);

// Ajoutez cette fonction pour gérer les émojis
const handleEmojiClick = (emojiData) => {
  const { emoji } = emojiData;
  const ref = document.querySelector('.message-input');
  
  // Insérer l'émoji à la position du curseur
  const newText = 
    newMessage.substring(0, cursorPosition) + 
    emoji + 
    newMessage.substring(cursorPosition);
  
  setNewMessage(newText);
  setShowEmojiPicker(false);
  
  // Déplacer le curseur après l'émoji inséré
  setTimeout(() => {
    ref.selectionStart = ref.selectionEnd = cursorPosition + emoji.length;
  }, 0);
};

// Ajoutez ceci pour suivre la position du curseur
const handleInputClick = () => {
  const ref = document.querySelector('.message-input');
  setCursorPosition(ref.selectionStart || 0);
};


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.match('image.*')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.match('video.*')) {
      setSelectedFile(file);
      const videoPreview = URL.createObjectURL(file);
      setFilePreview(videoPreview);
    } else {
      setSelectedFile(file);
      setFilePreview(null);
    }
  };

  const handleDocUploadClick = () => {
    docInputRef.current.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleAudioUploadClick = () => {
    audioInputRef.current.click();
  };

  // Fonctions pour l'enregistrement audio
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Créer un fichier à partir du blob
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setSelectedFile(audioFile);
        
        // Créer une URL de prévisualisation
        const audioUrl = URL.createObjectURL(audioBlob);
        setFilePreview(audioUrl);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access denied or error occurred');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const uploadFileToServer = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      // Déterminer le bon endpoint en fonction du type de fichier
      const endpoint = file.type.startsWith('audio/') 
        ? '/upload-audio'
        : '/upload';
  
      const response = await fetch(`http://localhost:5000/MessengerRoute${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
  
      // Vérification de la réponse
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Upload error:', {
        fileName: file.name,
        type: file.type,
        size: file.size,
        error: error.message
      });
      throw new Error(`Échec de l'envoi du fichier: ${error.message}`);
    }
  };
  
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentUserId || !selectedUser) return;
  
    try {
      setIsUploading(true);
      let attachment = null;
  
      if (selectedFile) {
        try {
          const fileInfo = await uploadFileToServer(selectedFile);
          attachment = {
            url: fileInfo.url,
            fileType: fileInfo.fileType,
            originalName: fileInfo.originalName
          };
        } catch (uploadError) {
          alert(uploadError.message);
          return;
        }
      }
  
      // Création du message optimiste
      const tempId = Date.now();
      const optimisticMessage = {
        _id: tempId,
        sender: currentUserId,
        receiver: selectedUser._id,
        content: newMessage,
        attachments: attachment ? [attachment] : [],
        createdAt: new Date(),
        isOptimistic: true
      };
  
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      setSelectedFile(null);
      setFilePreview(null);
  
      // Envoi via socket
      socketRef.current.emit('sendMessage', {
        senderId: currentUserId,
        receiverId: selectedUser._id,
        content: newMessage,
        attachments: attachment ? [attachment] : []
      });
  
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };









  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedUser) {
    return (
      <div className="chat-area empty-state">
        <p>Select a user to start chatting</p>
      </div>
    );
  }

  const isSelfConversation = currentUserId === selectedUser._id;
  const defaultProfileImage = "https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png";

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <img 
              src={selectedUser.profilePicture || defaultProfileImage} 
              alt={`${selectedUser.firstName} ${selectedUser.lastName}`} 
            />
            <span className="online-indicator"></span>
          </div>
          <div>
            <span className="chat-header-name">{selectedUser.firstName} {selectedUser.lastName}</span>
            <span className="chat-header-status">Active Now</span>
          </div>
        </div>
        <div className="chat-header-actions">
          <div className="chat-header-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div className="chat-header-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="16" y1="16" x2="22" y2="22"></line>
            </svg>
          </div>
          <div className="chat-header-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </div>
        </div>
      </div>

      <div className="messages-container" ref={messagesContainerRef}>
        <div className="scrollable-content">
          <div className="user-profile-section">
            <div className="user-profile-content">
              <img 
                src={selectedUser.profilePicture || defaultProfileImage} 
                alt={`${selectedUser.firstName} ${selectedUser.lastName}`} 
                className="user-profile-image"
              />
              <div className="user-profile-details">
                <h2 className="user-full-name">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <p className="user-job-title">
                  {selectedUser.jobTitle ? selectedUser.jobTitle : "Engineer"}
                </p>
                <p className="user-bio">
                  {selectedUser.bio ? selectedUser.bio : "I never dream of success. I worked for it..."}
                </p>
                <button className="view-profile-btn">Voir Profil</button>
                
                {isSelfConversation && (
                  <div className="personal-conversation-note">
                    <p>Your personal conversation space</p>
                    <small>Messages you send to yourself will appear here</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="messages-list">
            {messages.map((message, index) => {
              const isSent = (typeof message.sender === 'string' ? message.sender === currentUserId : message.sender._id === currentUserId);             
              const showAvatar = index === 0 || 
                              !messages[index - 1].sender || 
                              !message.sender ||
                              messages[index - 1].sender._id !== message.sender._id || 
                              (new Date(message.createdAt) - new Date(messages[index - 1].createdAt)) > 5 * 60 * 1000;

              return (
                <div key={message._id || index} className={`message-container ${isSent ? 'sent' : 'received'}`}>
                  {!isSent && showAvatar && message.sender && (
                    <img 
                      src={message.sender.profilePicture || defaultProfileImage} 
                      alt={`${message.sender.firstName} ${message.sender.lastName}`}
                      className="message-avatar"
                    />
                  )}
                  
                  <div className={`message ${isSent ? 'message-sent' : 'message-received'}`}>
                    {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType === 'image' && (
                      <div className="message-image-container">
                        <img 
                          src={message.attachments[0].url} 
                          alt="Attachment" 
                          className="message-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/250x250?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    )}
                    
                    {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType === 'video' && (
                      <div className="message-image-container">
                        <video 
                          controls 
                          className="message-image"
                          poster="https://via.placeholder.com/250x250?text=Video+Preview"
                        >
                          <source src={message.attachments[0].url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    
                    {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType === 'audio' && (
                      <div className="message-audio-container">
                        <audio 
                          controls 
                          ref={audioPlayerRef}
                          className="message-audio-player"
                        >
                          <source src={message.attachments[0].url} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                        <a
                          href={`${message.attachments[0].url}?fl_attachment`}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-audio-btn"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    )}
                    
                    {message.attachments && message.attachments.length > 0 && 
                      (message.attachments[0].fileType === 'document' || message.attachments[0].fileType === 'other') && (
                      <div className="message-document-container">
                        <div className="document-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                        </div>
                        <div className="document-info">
                          <span className="document-name">{message.attachments[0].originalName || 'Document'}</span>
                          <a
                            href={`${message.attachments[0].url}?fl_attachment`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Télécharger
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {message.content && (
                      <div className="message-content">
                        {message.content}
                      </div>
                    )}
                    <div className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.isOptimistic && <span className="message-status">Sending...</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {filePreview && selectedFile?.type.startsWith('audio/') && (
        <div className="audio-preview-container">
          <audio controls src={filePreview} className="audio-preview" />
          <button 
            onClick={() => {
              setFilePreview(null);
              setSelectedFile(null);
              setAudioBlob(null);
            }} 
            className="remove-audio-btn"
          >
            ×
          </button>
        </div>
      )}

      <div className="input-area">
        <div className="input-actions">
          <div className="input-action-btn" onClick={handleUploadClick} title="Upload image or video">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          


          <div className="input-action-btn" onClick={handleDocUploadClick} title="Upload document">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          



          <div className="emoji-picker-container">
      <button 
        className="input-action-btn"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        type="button"
        title="Emoji"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
      </button>
      
      {showEmojiPicker && (
        <div className="emoji-picker-wrapper">
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            width={300}
            height={350}
            previewConfig={{ showPreview: false }}
            searchDisabled={false}
            skinTonesDisabled
          />
        </div>
      )}
    </div>






         
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />
          
          <input
            type="file"
            ref={docInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
            style={{ display: 'none' }}
          />
          
          <input
            type="file"
            ref={audioInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            style={{ display: 'none' }}
          />
        </div>

        <input 
          type="text" 
          className="message-input" 
          placeholder="Aa"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onClick={handleInputClick}
          onKeyUp={handleInputClick}
        />




<div 
            className={`input-action-btn ${isRecording ? 'recording-active' : ''}`} 
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Record audio'}
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </div>

          
        <button 
          className="send-button"
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isUploading}
        >
          {isUploading ? (
            <div className="loading-spinner"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatConversation;