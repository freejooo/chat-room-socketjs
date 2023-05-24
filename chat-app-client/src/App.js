import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import "./App.css";

const socket = io('http://localhost:3001');

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const messageListRef = useRef(null);

  useEffect(() => {
    socket.on('chat message', message => {
      setMessages(prevMessages => [...prevMessages, message]);
      scrollToBottom();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:3001/messages');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMessages(data.reverse());
        scrollToBottom();
      } catch (error) {
        console.error('Fetching messages failed: ', error);
      }
    };

    fetchMessages();
  }, []);

  const scrollToBottom = () => {
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  };

  const handleSendMessage = () => {
    if (inputMessage && username) {
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
    <div>
      <h1>Chat App</h1>

      <div className="chat-container">
        <div className="message-list" ref={messageListRef}>
          {messages.map((message, index) => (
            <div key={index} className="message">
              <span className="message-username">{message.username}:</span>{' '}
              <span className="message-content">{message.message}</span>
            </div>
          ))}
        </div>

        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder="Type your message..."
          />

          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your username..."
          />

          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
