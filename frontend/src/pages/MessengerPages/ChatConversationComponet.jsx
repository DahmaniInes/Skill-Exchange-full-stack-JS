import React, { useState, useEffect, useRef } from 'react';
import './MessengerApplicationStyles.css';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import EmojiPicker from 'emoji-picker-react';
import { FiPhoneCall, FiPhoneOff } from 'react-icons/fi';

const ChatConversation = ({ selectedUser }) => {
  const [callStatus, setCallStatus] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callData, setCallData] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
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
  const callIntervalRef = useRef(null);
  const callDurationRef = useRef(0);
  const [callDuration, setCallDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false); // Added missing state declaration

  // Fonctions utilitaires (inchangées)
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const cancelCall = () => {
    if (callData?._id && (callStatus === 'calling' || callStatus === 'incoming')) {
      console.log('Cancel call triggered', { callId: callData._id, receiverId: selectedUser._id });
      socketRef.current.emit('cancelCall', { callId: callData._id, receiverId: selectedUser._id });
      setCallStatus(null);
      setCallData(null);
      setCallType(null);
    } else {
      console.log('Cancel call not triggered: invalid state', { callData, callStatus });
    }
  };

  const handleVoiceCall = () => {
    if (!selectedUser || !socketRef.current) return;
    const callData = { callerId: currentUserId, receiverId: selectedUser._id, startTime: new Date(), type: 'audio' };
    setCallType('audio');
    setCallStatus('calling');
    setCallData(callData);
    socketRef.current.emit('initiateCall', callData);
  };

  const handleVideoCall = () => {
    if (!selectedUser || !socketRef.current) return;
    const callData = { callerId: currentUserId, receiverId: selectedUser._id, startTime: new Date(), type: 'video' };
    setCallType('video');
    setCallStatus('calling');
    setCallData(callData);
    socketRef.current.emit('initiateCall', callData);
  };

  const handleCallResponse = (accepted) => {
    if (!callData) return;
    const responseData = { callId: callData._id, accepted, receiverId: currentUserId };
    if (accepted) {
      setCallStatus('ongoing');
      startCall();
    } else {
      socketRef.current.emit('callResponse', responseData);
      setCallStatus(null);
      setCallData(null);
      setCallType(null);
    }
  };

  const endCall = async () => {
    try {
      setCallStatus('ended');
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((track) => track.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
      const duration = callDurationRef.current;
      if (callData?._id) {
        socketRef.current.emit('endCall', { callId: callData._id, duration, type: callType });
      }
    } catch (error) {
      console.error('Error in endCall:', error);
    } finally {
      setTimeout(() => {
        setCallStatus(null);
        setCallType(null);
        setCallData(null);
        setCallDuration(0);
        callDurationRef.current = 0;
      }, 2000);
    }
  };

  const startCall = async () => {
    try {
      callIntervalRef.current = setInterval(() => {
        callDurationRef.current += 1;
        setCallDuration(callDurationRef.current);
      }, 1000);
      const stream = await navigator.mediaDevices.getUserMedia(
        callType === 'video' ? { video: true, audio: true } : { audio: true }
      );
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      peerConnectionRef.current = new RTCPeerConnection(configuration);
      stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('iceCandidate', { candidate: event.candidate, receiverId: selectedUser._id });
        }
      };
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit('callOffer', { offer, callerId: currentUserId, receiverId: selectedUser._id });
    } catch (error) {
      console.error('Error starting call:', error);
      endCall();
    }
  };

  // Toggle the visibility of the more menu
  const toggleMoreMenu = () => {
    setShowMoreMenu((prev) => !prev);
  };

  // Placeholder functions for menu actions (you can implement these as needed)
  const handleAddPerson = () => {
    console.log('Add person to conversation');
    setShowMoreMenu(false);
    // Add your logic here
  };

  const handleDeleteConversation = () => {
    console.log('Delete conversation');
    setShowMoreMenu(false);
    // Add your logic here
  };

  const handleEnableEmailNotifications = () => {
    console.log('Enable email notifications');
    setShowMoreMenu(false);
    // Add your logic here
  };

  const handleDisableNotifications = () => {
    console.log('Disable notifications');
    setShowMoreMenu(false);
    // Add your logic here
  };

  // Socket.IO et logique principale (inchangée)
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.userId);
      const socket = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        extraHeaders: { Authorization: `Bearer ${token}` },
      });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('authenticate', decoded.userId));
      socket.on('callInitiated', (call) => {
        console.log('Call initiated received:', call);
        setCallData(call);
      });
      socket.on('incomingCall', (data) => {
        if (data.callerId !== currentUserId) {
          setCallType(data.type);
          setCallStatus('incoming');
          setCallData(data);
          const missedCallTimer = setTimeout(() => {
            if (callStatus === 'incoming') {
              socketRef.current.emit('callMissed', { callId: data._id, receiverId: currentUserId });
              setCallStatus(null);
              setCallData(null);
              setCallType(null);
            }
          }, 30000);
          return () => clearTimeout(missedCallTimer);
        }
      });
      socket.on('callMissed', (data) => {
        setCallStatus(null);
        setCallData(null);
        setCallType(null);
        if (data.message) {
          setMessages((prev) => (!prev.some((msg) => msg._id === data.message._id) ? [...prev, data.message] : prev));
        }
      });
      socket.on('callCancelled', (data) => {
        console.log('Call cancelled received:', data);
        setCallStatus(null);
        setCallData(null);
        setCallType(null);
      });
      socket.on('callStatusUpdate', (data) => {
        setCallStatus(data.status);
        if (data.status === 'rejected' || data.status === 'missed') {
          setCallStatus(null);
          setCallData(null);
          setCallType(null);
        }
        setMessages((prev) => {
          const updatedMessages = prev.filter((msg) => msg._id !== data.callId);
          if (data.message && !updatedMessages.some((msg) => msg._id === data.message._id)) {
            updatedMessages.push(data.message);
          }
          return updatedMessages;
        });
      });
      socket.on('newMessage', (message) => {
        setMessages((prev) => (!prev.some((msg) => msg._id === message._id) ? [...prev, message] : prev));
      });
      socket.on('messageHistory', (history) => setMessages(history));
      socket.on('callEnded', (data) => {
        if (callIntervalRef.current) clearInterval(callIntervalRef.current);
        if (data.message) {
          setMessages((prev) => (!prev.some((msg) => msg._id === data.message._id) ? [...prev, data.message] : prev));
        }
        setCallStatus('ended');
        setTimeout(() => {
          setCallStatus(null);
          setCallData(null);
          setCallType(null);
        }, 2000);
      });
      socket.on('callOffer', async (data) => {
        if (peerConnectionRef.current && callStatus === 'ongoing') {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('callAnswer', { answer, callerId: data.callerId, receiverId: decoded.userId });
        }
      });
      socket.on('callAnswer', async (data) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });
      socket.on('iceCandidate', async (data) => {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });
      if (selectedUser) {
        socket.emit('getMessages', { userId: decoded.userId, otherUserId: selectedUser._id });
      }
      return () => {
        socket.disconnect();
        endCall();
      };
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }, [selectedUser, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gestion des émojis et fichiers (inchangée)
  const handleEmojiClick = (emojiData) => {
    const { emoji } = emojiData;
    const ref = document.querySelector('.message-input');
    const newText = newMessage.substring(0, cursorPosition) + emoji + newMessage.substring(cursorPosition);
    setNewMessage(newText);
    setShowEmojiPicker(false);
    setTimeout(() => {
      ref.selectionStart = ref.selectionEnd = cursorPosition + emoji.length;
    }, 0);
  };

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
      reader.onload = (event) => setFilePreview(event.target.result);
      reader.readAsDataURL(file);
    } else if (file.type.match('video.*')) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(file);
      setFilePreview(null);
    }
  };

  const handleDocUploadClick = () => docInputRef.current.click();
  const handleUploadClick = () => fileInputRef.current.click();
  const handleAudioUploadClick = () => audioInputRef.current.click();

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setSelectedFile(audioFile);
        setFilePreview(URL.createObjectURL(audioBlob));
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
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const endpoint = file.type.startsWith('audio/') ? '/upload-audio' : '/upload';
    const response = await fetch(`http://localhost:5000/MessengerRoute${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
    });
    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentUserId || !selectedUser) return;
    try {
      setIsUploading(true);
      let attachment = null;
      if (selectedFile) {
        const fileInfo = await uploadFileToServer(selectedFile);
        attachment = { url: fileInfo.url, fileType: fileInfo.fileType, originalName: fileInfo.originalName };
      }
      const tempId = Date.now();
      const optimisticMessage = {
        _id: tempId,
        sender: currentUserId,
        receiver: selectedUser._id,
        content: newMessage,
        attachments: attachment ? [attachment] : [],
        createdAt: new Date(),
        isOptimistic: true,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      socketRef.current.emit('sendMessage', {
        senderId: currentUserId,
        receiverId: selectedUser._id,
        content: newMessage,
        attachments: attachment ? [attachment] : [],
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

  // Icônes (inchangées)
  const VideoCallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z"></path>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  );

  const CallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  );

  // Rendu
  if (!selectedUser) {
    return (
      <div className="chat-area empty-state">
        <p>Select a user to start chatting</p>
      </div>
    );
  }

  const isSelfConversation = currentUserId === selectedUser._id;
  const defaultProfileImage = 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png';

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <img src={selectedUser.profilePicture || defaultProfileImage} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
            <span className="online-indicator"></span>
          </div>
          <div>
            <span className="chat-header-name">{selectedUser.firstName} {selectedUser.lastName}</span>
            <span className="chat-header-status">Active Now</span>
          </div>
        </div>

        <div className="chat-header-actions">
          {!isSelfConversation && (
            <>
              <div className="chat-header-btn" onClick={handleVoiceCall}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06BBCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="chat-header-btn" onClick={handleVideoCall}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06BBCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"></path>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
            </>
          )}
          <div className="chat-header-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06BBCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="16" y1="16" x2="22" y2="22"></line>
            </svg>
          </div>
          <div className="chat-header-btn more-menu-container" onClick={toggleMoreMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06BBCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
            {showMoreMenu && (
              <div className="more-menu">
                <button onClick={handleAddPerson}>Ajouter personne à la conversation</button>
                <button onClick={handleDeleteConversation}>Supprimer conversation</button>
                <button onClick={handleEnableEmailNotifications}>Recevoir des notifications par email</button>
                <button onClick={handleDisableNotifications}>Désactiver notifications</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {callStatus && (
        <div className={`call-container ${callStatus}`}>
          {callStatus === 'calling' && (
            <div className="call-modal">
              <h3>Appel {callType === 'video' ? 'vidéo' : 'vocale'} en cours...</h3>
              <div className="call-actions">
                <button onClick={cancelCall} className="end-call-btn">Annuler</button>
              </div>
            </div>
          )}
          {callStatus === 'incoming' && callData && (
            <div className="call-modal">
              <h3>Appel {callData.type === 'video' ? 'vidéo' : 'vocale'} entrant</h3>
              <div className="caller-info">
                <img src={selectedUser.profilePicture || defaultProfileImage} alt="Caller" />
                <p>Appel de {selectedUser.firstName}</p>
              </div>
              <div className="call-actions">
                <button onClick={() => handleCallResponse(true)} className="accept-call-btn">
                  <FiPhoneCall /> Accepter
                </button>
                <button onClick={() => handleCallResponse(false)} className="reject-call-btn">
                  <FiPhoneOff /> Refuser
                </button>
              </div>
            </div>
          )}
          {callStatus === 'ongoing' && (
            <div className="ongoing-call">
              <div className="video-container">
                {callType === 'video' && (
                  <>
                    <video ref={localVideoRef} autoPlay muted className="local-video" />
                    <video ref={remoteVideoRef} autoPlay className="remote-video" />
                  </>
                )}
                {callType === 'audio' && (
                  <div className="audio-call-ui">
                    <div className="user-avatar">
                      <img src={selectedUser.profilePicture || defaultProfileImage} alt={selectedUser.firstName} />
                    </div>
                    <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p>Appel en cours... {formatDuration(callDuration)}</p>
                  </div>
                )}
              </div>
              <button onClick={endCall} className="end-call-btn" style={{ backgroundColor: 'red', color: 'white' }}>
                Terminer l'appel
              </button>
            </div>
          )}
          {callStatus === 'ended' && (
            <div className="call-modal">
              <h3>Appel terminé</h3>
            </div>
          )}
        </div>
      )}

      <div className="messages-container" ref={messagesContainerRef}>
        <div className="scrollable-content">
          <div className="user-profile-section">
            <div className="user-profile-content">
              <img src={selectedUser.profilePicture || defaultProfileImage} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} className="user-profile-image" />
              <div className="user-profile-details">
                <h2 className="user-full-name">{selectedUser.firstName} {selectedUser.lastName}</h2>
                <p className="user-job-title">{selectedUser.jobTitle ? selectedUser.jobTitle : 'Engineer'}</p>
                <p className="user-bio">{selectedUser.bio ? selectedUser.bio : 'I never dream of success. I worked for it...'}</p>
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
              if (message.isCall) {
                const callData = message.callData;
                return (
                  <div key={message._id || `call-${index}`} className={`message-container ${callData.caller === currentUserId ? 'sent' : 'received'}`}>
                    <div className={`call-message ${callData.callClass}`}>
                      <div className={`call-icon ${callData.iconColor}`}>
                        {callData.type === 'video' ? <VideoCallIcon /> : <CallIcon />}
                      </div>
                      <div className="call-info">
                        <div className="call-status">
                          {message.content}
                          {callData.status === 'missed' && <span className="missed-call-badge">Manqué</span>}
                          {callData.status === 'rejected' && <span className="rejected-call-badge">Refusé</span>}
                          {callData.status === 'ignored' && <span className="ignored-call-badge">Ignoré</span>}
                        </div>
                        {callData.duration > 0 && callData.status === 'ended' && (
                          <div className="call-duration">Durée: {formatDuration(callData.duration)}</div>
                        )}
                        <div className="call-time">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const isSent = typeof message.sender === 'string' ? message.sender === currentUserId : message.sender._id === currentUserId;
              const showAvatar =
                index === 0 ||
                !messages[index - 1].sender ||
                !message.sender ||
                messages[index - 1].sender._id !== message.sender._id ||
                new Date(message.createdAt) - new Date(messages[index - 1].createdAt) > 5 * 60 * 1000;

              return (
                <div key={message._id || `msg-${index}`} className={`message-container ${isSent ? 'sent' : 'received'}`}>
                  {!isSent && showAvatar && message.sender && (
                    <img src={message.sender.profilePicture || defaultProfileImage} alt={`${message.sender.firstName} ${message.sender.lastName}`} className="message-avatar" />
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
                        <video controls className="message-image" poster="https://via.placeholder.com/250x250?text=Video+Preview">
                          <source src={message.attachments[0].url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType === 'audio' && (
                      <div className="message-audio-container">
                        <audio controls ref={audioPlayerRef} className="message-audio-player">
                          <source src={message.attachments[0].url} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                        <a href={`${message.attachments[0].url}?fl_attachment`} download target="_blank" rel="noopener noreferrer" className="download-audio-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    )}
                    {message.attachments && message.attachments.length > 0 && (message.attachments[0].fileType === 'document' || message.attachments[0].fileType === 'other') && (
                      <div className="message-document-container">
                        <div className="document-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                        </div>
                        <div className="document-info">
                          <span className="document-name">{message.attachments[0].originalName || 'Document'}</span>
                          <a href={`${message.attachments[0].url}?fl_attachment`} download target="_blank" rel="noopener noreferrer">Télécharger</a>
                        </div>
                      </div>
                    )}
                    {message.content && <div className="message-content">{message.content}</div>}
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
          <button onClick={() => { setFilePreview(null); setSelectedFile(null); setAudioBlob(null); }} className="remove-audio-btn">×</button>
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
            <button className="input-action-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} type="button" title="Emoji">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker-wrapper">
                <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={350} previewConfig={{ showPreview: false }} searchDisabled={false} skinTonesDisabled />
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />
          <input type="file" ref={docInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,.xls,.xlsx" style={{ display: 'none' }} />
          <input type="file" ref={audioInputRef} onChange={handleFileChange} accept="audio/*" style={{ display: 'none' }} />
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

        <div className={`input-action-btn ${isRecording ? 'recording-active' : ''}`} onClick={toggleRecording} title={isRecording ? 'Stop recording' : 'Record audio'}>
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

        <button className="send-button" onClick={handleSendMessage} disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isUploading}>
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