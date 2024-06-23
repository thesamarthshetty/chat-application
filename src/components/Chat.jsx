import React, { useEffect, useState } from 'react';
import { ref, push, onValue, serverTimestamp, set, update } from 'firebase/database';
import { database } from '../Firebase';
import { Form, Button, Card } from 'react-bootstrap';

function Chat({ currentUser, chatUser }) {

  //storing unique path for each chat
  const chatId = [currentUser.uid, chatUser.userId].sort().join('-');
  // getting or updating state to store messages 
  const [messages, setMessages] = useState([]);
  // handling new message input
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // reference to the firebase database where chat messages are stored
    const messagesRef = ref(database, `chats/${chatId}/messages`);

    // listens for any changes in real-time
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const loadedMessages = [];
      // collecting each message 
      snapshot.forEach((childSnapshot) => {
        loadedMessages.push({
          messageId: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
      // updating the message to the state
      setMessages(loadedMessages);
      updateMessageStatuses(loadedMessages);
    });

    return () => unsubscribe();
  }, [chatId]);

  // this function is to update message statuses ie.'delivered' or 'read'
  const updateMessageStatuses = (loadedMessages) => {
    loadedMessages.forEach(message => {
      if (message.sender === currentUser.uid && message.status === 'sent' && chatUser.online) {
        update(ref(database, `chats/${chatId}/messages/${message.messageId}`), {
          status: 'delivered'
        });
      }
      if (message.sender !== currentUser.uid && message.status === 'delivered' && chatUser.online) {
        update(ref(database, `chats/${chatId}/messages/${message.messageId}`), {
          status: 'read'
        });
      }
    });
  };

  // this function is to handle sending new messages
  const handleSendMessage = () => {
    const messageRef = push(ref(database, `chats/${chatId}/messages`));
    set(messageRef, {
      sender: currentUser.uid,
      content: newMessage,
      timestamp: serverTimestamp(),
      status: 'sent',
    });
    setNewMessage('');
  };

  return (
    <div>
      <h2>Chat with {chatUser.name || 'Anonymous'}</h2>
      <div>
        {messages.map((message) => (
          <Card key={message.messageId} className="mb-3">
            <Card.Body>
              <Card.Text>{message.content}</Card.Text>
              <Card.Footer className="text-muted">
                <small>From: {message.sender === currentUser.uid ? 'You' : chatUser.name}</small>
                <br />
                {message.status === 'sent' && <span>✓</span>}
                {message.status === 'delivered' && <span>✓✓</span>}
                {message.status === 'read' && <span style={{ color: 'blue' }}>✓✓</span>}
              </Card.Footer>
            </Card.Body>
          </Card>
        ))}
      </div>
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
        />
      </Form.Group>
      <Button variant="primary" onClick={handleSendMessage}>Send</Button>
    </div>
  );
}

export default Chat;
