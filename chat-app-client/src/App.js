import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3002');

function App() {
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const messageListRef = useRef(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // eslint-disable-next-line
  const [selectingImage, setSelectingImage] = useState(false);

  const handleStartChat = () => {
    if (username) {
      setChatStarted(true);
      socket.connect();
      socket.emit('join', username);
    }
  };

  useEffect(() => {
    if (chatStarted) {
      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('chat message', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        scrollToBottom();
      });

      socket.on('active users', (users) => {
        setActiveUsers(users);
      });

      socket.on('user history', (history) => {
        setUserHistory(history);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setActiveUsers([]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [chatStarted]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await fetch('http://localhost:3002/messages');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const limitedMessages = data.slice(-50); // Limiting messages to the last 50
        setMessages(limitedMessages);
        scrollToBottom();
      } catch (error) {
        console.error('Fetching messages failed: ', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (chatStarted) {
      fetchMessages();
    }
  }, [chatStarted]);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const handleSendMessage = () => {
    if (inputMessage) {
      const message = {
        username,
        message: inputMessage,
        image: selectedImage,
      };

      socket.emit('chat message', message);
      setInputMessage('');
      setSelectedImage(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
      scrollToBottom();
    }
  };

  const handleMessage = (message) => {
    if (message.image) {
      return (
        <div className={`message-container ${message.username === username ? 'current-user' : 'other-user'}`}>
          <div className="message-content">
            <img src={message.image} alt="message content" className="message-image" />
          </div>
        </div>
      );
    } else {
      return (
        <div className={`message-container ${message.username === username ? 'current-user' : 'other-user'}`}>
          <div className="message-content">
          <span className="message-username">{message.username}:<br/><br/></span>
            {message.message}
            

          </div>
        </div>
      );
    }
  };
  
  
  
  
  





  useEffect(() => {
    const updateActiveUsers = () => {
      const activeUsernames = userHistory
        .filter((user) => user.status === 'connected')
        .map((user) => user.username);
      setActiveUsers(activeUsernames);
    };

    updateActiveUsers();
  }, [userHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageChange = (e) => {
    let files = e.target.files;
    if (files.length === 0) {
      console.log('No file selected');
      return;
    }

    let reader = new FileReader();
    reader.readAsDataURL(files[0]);

    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setSelectingImage(false); // Set selectingImage to false after image is selected
    };

    reader.onerror = (error) => {
      console.log('Error reading file:', error);
      setSelectingImage(false); // Set selectingImage to false on error as well
    };
  };
  const handleSendImage = () => {
    if (selectedImage) {
      const message = {
        username,
        message: '',
        image: selectedImage,
      };

      socket.emit('chat message', message);
      setSelectedImage(null);
    }
  };




  return (
    <div className="app">
      {!chatStarted ? (
        <div className="start-chat">
          <h1>Enter your username</h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username..."
          />
          <button onClick={handleStartChat}>Start Chat</button>
        </div>
      ) : (
        <div className="chat-container">
          <div className="sidebar">
            <h2>Active Users</h2>
            {activeUsers.length > 0 ? (
              <ul>
                {activeUsers.map((user) => (
                  <li key={user}>{user}</li>
                ))}
              </ul>
            ) : (
              <p>No active users</p>
            )}
          </div>
          <div className="chat">
            <div className="message-list" ref={messageListRef}>
              {loadingMessages ? (
                <p>Loading messages...</p>
              ) : messages.length > 0 ? (
                messages.map((message, index) => (
                  <div key={index} className="message">
                    {handleMessage(message)}
                  </div>
                ))
              ) : (
                <p>No messages</p>
              )}
            </div>
            <div className="input-container">
              <div className="username-container">
                <span className="message-username">{username}:</span>
              </div>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
              />
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept=".jpeg, .png, .jpg"
                  className="file-input"
                  onChange={(e) => handleImageChange(e)}
                />
                <button className="send-image-button" onClick={handleSendImage}>
                  <i className="fas fa-image"></i>
                </button>
              </div>
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
          <div className="user-history">
            <h2>User History</h2>
            {userHistory.length > 0 ? (
              <ul>
                {userHistory.map((user, index) => (
                  <li key={index}>
                    {user.username} - {user.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No user history</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
