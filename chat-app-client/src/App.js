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
        setMessages(data.reverse());
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
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  };

  const handleSendMessage = () => {
    if (inputMessage) {
      const message = {
        username,
        message: inputMessage,
      };

      socket.emit('chat message', message);

      setInputMessage('');
      scrollToBottom();
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
                messages.map((message) => (
                  <div key={message._id} className="message">
                    <span className="message-username">{message.username}:</span>{' '}
                    <span className="message-content">{message.message}</span>
                  </div>
                ))
              ) : (
                <p>No messages</p>
              )}
            </div>
            <div className="input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
              />
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
