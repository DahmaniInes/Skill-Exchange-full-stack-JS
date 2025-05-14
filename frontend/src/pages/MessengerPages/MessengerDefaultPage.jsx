import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { loadStripe } from '@stripe/stripe-js';
import styles from './DefaultPageStylesMessenger.module.css';
import chatIcon from './chat-icon.png'; // Add this image locally or use the URL of the provided icon

const stripePromise = loadStripe('pk_test_51RBp5T2RFwWmT2NuEkuwiq7H4wwlPXmeQuHqWITY7aTtYga8Dgg7bY5GqlAHuk90uQQ46vkC3xr8DIc6A0YsS6i400YKnIyKhQ');

const MessengerDefaultPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [communityUsers, setCommunityUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [recommendedGroups, setRecommendedGroups] = useState([]);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [purchasedTeachers, setPurchasedTeachers] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const userCardsRef = useRef([]);
  const socketRef = useRef(null);

  // Initialization and token verification
  useEffect(() => {
    console.log("=== MESSENGER DEFAULT PAGE INITIALIZATION ===");
    
    const token = localStorage.getItem('jwtToken');
    console.log('Raw token retrieved from localStorage:', token);

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        const userId = decoded.userId;
        if (!userId) {
          throw new Error('No user ID found in token (expected userId field)');
        }
        setCurrentUserId(userId);
        console.log('Logged-in user identified:', userId);
      } catch (err) {
        console.error('Error decoding JWT token:', err.message);
        setError('Invalid or corrupted token');
      }
    } else {
      console.warn('No JWT token found in localStorage');
      setError('Please log in');
    }

    socketRef.current = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket: Successfully connected to server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket: Connection error', error.message);
    });

    socketRef.current.on('userStatusUpdate', ({ userId, isOnline }) => {
      console.log(`Status update received: ${userId} -> ${isOnline ? 'online' : 'offline'}`);
      setCommunityUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => {
          if (user.id === userId) {
            console.log(`Updating ${user.name} (community): isOnline = ${isOnline}`);
            return { ...user, isOnline };
          }
          return user;
        });
        return updatedUsers;
      });
      setTeachers((prevTeachers) => {
        const updatedTeachers = prevTeachers.map((teacher) => {
          if (teacher.id === userId) {
            console.log(`Updating ${teacher.name} (teacher): isOnline = ${isOnline}`);
            return { ...teacher, isOnline };
          }
          return teacher;
        });
        return updatedTeachers;
      });
    });

    socketRef.current.on('chatbotMessage', (data) => {
      setChatMessages((prev) => [...prev, { text: data.response, sender: 'bot' }]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket: Disconnected');
      }
    };
  }, []);

  // Socket.IO authentication
  useEffect(() => {
    if (currentUserId && socketRef.current?.connected) {
      socketRef.current.emit('authenticate', currentUserId);
      console.log('Socket.IO authentication emitted for:', currentUserId);
    }
  }, [currentUserId]);

  // Fetch initial chatbot message
  useEffect(() => {
    const fetchInitialMessage = async () => {
      if (currentUserId && isChatOpen) {
        const token = localStorage.getItem('jwtToken');
        try {
          const response = await fetch('http://localhost:5000/MessengerRoute/proxy/chatbot/initial-message', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (response.ok && data.message) {
            setChatMessages([{ text: data.message, sender: 'bot' }]);
          } else {
            throw new Error('Error fetching initial message');
          }
        } catch (error) {
          console.error('Error fetching initial message:', error.message);
          setError(error.message);
        }
      }
    };
    fetchInitialMessage();
  }, [currentUserId, isChatOpen]);

  // Fetch users (teachers and community) + purchasedTeachers
  useEffect(() => {
    const fetchUsers = async () => {
      console.log("=== LOADING USERS ===");
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('No token found in localStorage');
        setError('Please log in to view users');
        setIsLoaded(true);
        return;
      }

      try {
        console.log('Token sent:', token);
        const response = await fetch('http://localhost:5000/MessengerRoute/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Data received from API:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} - ${data.message || response.statusText}`);
        }

        if (!data.success || !Array.isArray(data.data)) {
          throw new Error('API response is invalid or does not contain an array of users');
        }

        const filteredCommunityUsers = data.data
          .filter((user) => user.role === 'user' || user.role === 'student')
          .map((user) => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}${user._id === currentUserId ? ' (you)' : ''}`,
            isOnline: user.isOnline || false,
            profilePicture: user.profilePicture || null,
          }));

        const filteredTeachers = data.data
          .filter((user) => user.role === 'teacher' && user._id !== currentUserId)
          .map((user) => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            status: user.status || 'Teacher',
            isPremium: true,
            isOnline: user.isOnline || false,
            profilePicture: user.profilePicture || null,
          }));

        const currentUser = data.data.find((user) => user._id === currentUserId);
        if (currentUser && currentUser.purchasedTeachers) {
          setPurchasedTeachers(currentUser.purchasedTeachers);
          filteredTeachers.forEach((teacher) => {
            if (currentUser.purchasedTeachers.includes(teacher.id)) {
              teacher.isPremium = false;
            }
          });
        }

        console.log('Filtered community users:', filteredCommunityUsers);
        console.log('Filtered teachers:', filteredTeachers);
        console.log('Unlocked teachers:', purchasedTeachers);
        setCommunityUsers(filteredCommunityUsers);
        setTeachers(filteredTeachers);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error fetching users:', error.message);
        setError(error.message);
        setIsLoaded(true);
      }
    };

    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  // Fetch recommended groups
  useEffect(() => {
    const fetchRecommendations = async () => {
      console.log("=== LOADING RECOMMENDED GROUPS ===");
      const token = localStorage.getItem('jwtToken');
      if (!token || !currentUserId) {
        console.error('No token or userId found');
        setError('Please log in to view recommendations');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/MessengerRoute/get-recommendations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Recommendations response status:', response.status);
        const data = await response.json();
        console.log('Data received from recommendations API:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} - ${data.message || response.statusText}`);
        }

        if (!data.success || !Array.isArray(data.data)) {
          throw new Error('Recommendations API response is invalid');
        }

        setRecommendedGroups(data.data);
        console.log('Recommended groups:', data.data);
      } catch (error) {
        console.error('Error fetching recommendations:', error.message);
        setError(error.message);
      }
    };

    if (currentUserId) {
      fetchRecommendations();
    }
  }, [currentUserId]);

  // Animate cards
  useEffect(() => {
    userCardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
      }
    });
  }, [communityUsers, teachers, recommendedGroups]);

  // Handle click on a user or teacher
  const handleCardClick = async (user) => {
    if (user.isPremium) {
      console.log(`Clicked on teacher ${user.name}, redirecting to Stripe...`);
      
      const stripe = await stripePromise;

      try {
        const response = await fetch('http://localhost:5000/MessengerRoute/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacherId: user.id,
            teacherName: user.name,
            studentId: currentUserId,
          }),
        });

        const session = await response.json();

        if (session.error) {
          throw new Error(session.error);
        }

        console.log('Stripe session created with ID:', session.id);
        const result = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (result.error) {
          console.error('Error redirecting to Stripe:', result.error.message);
          setError(result.error.message);
        }
      } catch (error) {
        console.error('Error creating checkout session:', error.message);
        setError('Unable to redirect to payment');
      }
    } else if (!user.isPremium && teachers.some(t => t.id === user.id)) {
      console.log(`Clicked on unlocked teacher ${user.name}, no action for now`);
    } else {
      console.log(`Conversation opened with ${user.name}`);
    }
  };

  // Handle click on the "Join" button
  const handleJoinGroup = async (group) => {
    console.log(`Attempting to join group ${group.group_name} (${group.group_id})`);
    const token = localStorage.getItem('jwtToken');
    if (!token || !currentUserId) {
      setError('Please log in to join a group');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/MessengerRoute/join-group', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          groupId: group.group_id,
        }),
      });

      const data = await response.json();
      console.log('Join group response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error joining the group');
      }

      // Remove the joined group from the recommendations list
      setRecommendedGroups((prev) => prev.filter((g) => g.group_id !== group.group_id));
      console.log(`Group ${group.group_name} joined successfully`);
    } catch (error) {
      console.error('Error joining the group:', error.message);
      setError(error.message);
    }
  };

  // Redirect to MessengerPage
  const handleMessengerRedirect = () => {
    console.log('Redirecting to MessengerPage');
    window.location.href = 'http://localhost:5173/MessengerPage';
  };

  // Redirect to Dashboard
  const handleMessengerRedirectDashboard = () => {
    console.log('Redirecting to Dashboard');
    window.location.href = 'http://localhost:5173/dashboard';
  };

  const getAvatarContent = (user) => {
    if (user.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={user.name}
          className={styles.avatarImage}
          onError={(e) => (e.target.src = 'https://pbs.twimg.com/media/Fc-7kM3XkAEfuim.png')}
        />
      );
    }
    return <div className={styles.avatarPlaceholder}>{user.name.charAt(0).toUpperCase()}</div>;
  };

  // Handle sending message to chatbot
  const handleSendChatMessage = async () => {
    if (!inputMessage.trim()) return;

    const token = localStorage.getItem('jwtToken');
    const newMessage = { text: inputMessage, sender: 'user' };
    setChatMessages((prev) => [...prev, newMessage]);
    setInputMessage('');

    try {
      const response = await fetch('http://localhost:5000/MessengerRoute/proxy/chatbot/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });
      const data = await response.json();
      if (response.ok && data.response) {
        setChatMessages((prev) => [...prev, { text: data.response, sender: 'bot' }]);
      } else {
        throw new Error('Error sending message');
      }
    } catch (error) {
      console.error('Error sending message to chatbot:', error.message);
      setError(error.message);
    }
  };

  // Open/Close chat window
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && currentUserId) {
      socketRef.current.emit('sendChatbotMessage', { message: '' }); // Trigger initial message via Socket
    }
  };

  return (
    <div className={styles.messengerContainer}>
      <div className={`${styles.welcomeHeader} ${isLoaded ? styles.loaded : ''}`}>
        <h1>Welcome to Your Chat Space</h1>
        <p>Connect with teachers or other learners in real-time</p>
      </div>

      <div className={`${styles.actionButtons} ${isLoaded ? styles.loaded : ''}`}>
        <button className={styles.actionButton} onClick={handleMessengerRedirect}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
          </svg>
          View in Messenger
        </button>

        <button className={styles.actionButton} onClick={handleMessengerRedirectDashboard}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
          My Dashboard
        </button>
      </div>

      <div className={styles.conversationsSection}>
        <div className={`${styles.sectionColumn} ${isLoaded ? styles.loaded : ''}`} style={{ animationDelay: '0.3s' }}>
          <div className={styles.sectionHeader}>
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
                <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
              </svg>
              Teachers
              <span className={styles.premiumBadge}>Premium</span>
            </h2>
          </div>

          <div className={styles.premiumNote}>
            A premium subscription is required to access conversations with our expert teachers.
          </div>

          <div className={styles.userList}>
            {teachers.length > 0 ? (
              teachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className={`${styles.userCard} ${!teacher.isPremium ? styles.unlockedCard : ''}`}
                  ref={(el) => (userCardsRef.current[index] = el)}
                  onClick={() => handleCardClick(teacher)}
                >
                  <div className={styles.userAvatar}>
                    {getAvatarContent(teacher)}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{teacher.name}</div>
                    <div className={styles.userStatus}>{teacher.status}</div>
                  </div>
                  <span className={`${styles.userBadge} ${teacher.isPremium ? styles.badgePremium : styles.badgeUnlocked}`}>
                    {teacher.isPremium ? 'Premium' : 'Unlocked'}
                  </span>
                </div>
              ))
            ) : (
              <p>No teachers to display</p>
            )}
          </div>

          <div className={styles.sectionFooter}>
            <button className={styles.viewMoreBtn}>
              View More
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={`${styles.sectionColumn} ${isLoaded ? styles.loaded : ''}`} style={{ animationDelay: '0.45s' }}>
          <div className={styles.sectionHeader}>
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 1 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
              Community
              <span className={styles.badgeFree}>Free</span>
            </h2>
          </div>

          {error ? (
            <div className={styles.errorMessage}>
              <p>Error: {error}</p>
            </div>
          ) : !isLoaded ? (
            <p>Loading users...</p>
          ) : (
            <div className={styles.userList}>
              {communityUsers.length > 0 ? (
                communityUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className={styles.userCard}
                    ref={(el) => (userCardsRef.current[teachers.length + index] = el)}
                    onClick={() => handleCardClick(user)}
                  >
                    <div className={styles.userAvatar}>
                      {getAvatarContent(user)}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user.name}</div>
                      <div className={`${styles.userStatus} ${user.isOnline ? styles.online : ''}`}>
                        {user.isOnline ? (
                          <span style={{ color: '#98FF98' }}>Online</span>
                        ) : (
                          'Offline'
                        )}
                      </div>
                    </div>
                    {user.isOnline && <div className={styles.activeDot}></div>}
                  </div>
                ))
              ) : (
                <p>No users to display</p>
              )}
            </div>
          )}

          <div className={styles.sectionFooter}>
            <button className={styles.viewMoreBtn}>
              View More
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={`${styles.sectionColumn} ${isLoaded ? styles.loaded : ''}`} style={{ animationDelay: '0.6s' }}>
          <div className={styles.sectionHeader}>
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Recommended Groups
            </h2>
          </div>

          {error ? (
            <div className={styles.errorMessage}>
              <p>Error: {error}</p>
            </div>
          ) : recommendedGroups.length > 0 ? (
            <div className={styles.userList}>
              {recommendedGroups.map((group, index) => (
                <div
                  key={group.group_id}
                  className={styles.userCard}
                  ref={(el) => (userCardsRef.current[teachers.length + communityUsers.length + index] = el)}
                >
                  <div className={styles.userAvatar}>
                    <div className={styles.avatarPlaceholder}>{group.group_name.charAt(0).toUpperCase()}</div>
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{group.group_name}</div>
                    <div className={styles.userStatus}>{group.category}</div>
                  </div>
                  <span
                    className={`${styles.userBadge} ${styles.badgeJoin}`}
                    onClick={() => handleJoinGroup(group)}
                  >
                    Join
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
              </svg>
              <h3>No Recommendations Available</h3>
              <p>Join groups to get recommendations</p>
            </div>
          )}

          <div className={styles.sectionFooter}>
            <button className={styles.viewMoreBtn}>
              View More
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chatbot icon in bottom right */}
      <div className={styles.chatIcon} onClick={toggleChat}>
        <img src={chatIcon} alt="Chatbot" className={styles.chatIconImage} />
      </div>

      {/* Chat window */}
      {isChatOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <h3>Chatbot - Assistance</h3>
            <button onClick={toggleChat} className={styles.closeButton}>×</button>
          </div>
          <div className={styles.chatMessages}>
            {chatMessages.map((msg, index) => (
              <div key={index} className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Type your message..."
            />
            <button onClick={handleSendChatMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessengerDefaultPage;