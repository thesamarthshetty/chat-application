import React, { useEffect, useState } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getDatabase, ref, update, onDisconnect } from 'firebase/database';
import OnlineUsers from './components/OnlineUsers';
import Chat from './components/Chat';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Button, Form, Card } from 'react-bootstrap';

// firebase auth and satabase
const auth = getAuth();
const database = getDatabase();

function App() {
  //getting or  updating state to manage the current authenticated user
  const [user, setUser] = useState(null);
  // getting or  updating state to manage which user is currently selected for chatting
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  // getting or  updating state to manage of toggle between registration and login forms
  const [isRegistering, setIsRegistering] = useState(false);

  //used useEffect hook to handle authentication state changes
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        //updating user status to online once they are login into database
        const userRef = ref(database, `users/${user.uid}`);
        update(userRef, { online: true, name: user.displayName });

        //changin user status to offline once they are logout
        onDisconnect(userRef).update({ online: false });
      }
    });
  }, []);

  //this function is to handel the user registration
  const handleRegister = async (event) => {
    event.preventDefault();
    const name = event.target.name.value;
    const email = event.target.email.value;
    const password = event.target.password.value;
    try {
      //create and storing the user details 
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast.success('User registered successfully. You can now log in.');
    } catch (error) {
      console.error('Error registering:', error);
      toast.error(error.message);
    }
  };

  //this function is to handel the user login
  const handleLogin = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error(error.message);
    }
  };

  //this function is to handel the user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error(error.message);
    }
  };

  // to store the selected user  
  const handleSelectChatUser = (user) => {
    setSelectedChatUser(user);
  };

  //this function is to close the chat window
  const handleCloseChat = () => {
    setSelectedChatUser(null);
  };

  return (
    <Container className="mt-5">
      <ToastContainer />
      {user ? (
        <div>
          <h2>Welcome, {user.displayName}</h2>
          <Button variant="danger" onClick={handleLogout} className="mb-3">Logout</Button>
          <OnlineUsers currentUser={user} onSelectUser={handleSelectChatUser} />
          {selectedChatUser && (
            <div>
              <Chat currentUser={user} chatUser={selectedChatUser} />
              <Button variant="danger" onClick={handleCloseChat} className="mb-3 mt-3">Close Chat</Button>
            </div>
          )}
        </div>
       
      ) : (
        <Card className="p-3">
          {isRegistering ? (
            <Form onSubmit={handleRegister}>
              <h2>Register</h2>
              <Form.Group className="mb-3" controlId="formBasicName">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" name="name" placeholder="Enter your name" required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" name="email" placeholder="Enter email" required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" name="password" placeholder="Password" required />
              </Form.Group>
              <Button variant="primary" type="submit" className="me-2">Register</Button>
              <Button variant="secondary" onClick={() => setIsRegistering(false)}>Go to Login</Button>
            </Form>
          ) : (
            <Form onSubmit={handleLogin}>
              <h2>Login</h2>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" name="email" placeholder="Enter email" required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" name="password" placeholder="Password" required />
              </Form.Group>
              <Button variant="success" type="submit" className="me-2">Login</Button>
              <Button variant="secondary" onClick={() => setIsRegistering(true)}>Go to Register</Button>
            </Form>
          )}
        </Card>
      )}
    </Container>
  );
}

export default App;
