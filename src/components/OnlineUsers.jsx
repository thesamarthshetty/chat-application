import React, { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { database } from '../Firebase';
import { ListGroup, Badge } from 'react-bootstrap';

function OnlineUsers({ currentUser, onSelectUser }) {
  // getting or updating state of online, offline user and thire unread message count 
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [offlineUsers, setOfflineUsers] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});

    //console.log('unreadCounts',unreadCounts['TPSfs5WNeYTZYPLlECfAfmRMX8E3'],onlineUsers,unreadCounts)
    onlineUsers.map(x=>console.log('unreadCounts--->',unreadCounts[x.userId],x.userId,unreadCounts))

    //used useEffect hooks to monitor changes in user status in real-time
    useEffect(() => {
        const usersRef = ref(database, 'users');
        const onlineUsersQuery = query(usersRef, orderByChild('online'), equalTo(true));
        const offlineUsersQuery = query(usersRef, orderByChild('online'), equalTo(false));

        const handleUserChange = async (snapshot, isOnline) => {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                const user = {
                    userId: childSnapshot.key,
                    ...childSnapshot.val(),
                };
                if (user.userId !== currentUser.uid) {
                    users.push(user);
                }
            });
            if(isOnline) console.log('isOnlineisOnline',users)
            isOnline ? setOnlineUsers(users) : setOfflineUsers(users);
            await fetchUnreadCounts(users);
        };

        // getting real-time listeners for online and offline user queries
        onValue(onlineUsersQuery, (snapshot) => handleUserChange(snapshot, true));
        onValue(offlineUsersQuery, (snapshot) => handleUserChange(snapshot, false));
    }, [currentUser.uid]);

    
    //fetch and count unread messages and storing setUnreadCounts state it for each user
    const fetchUnreadCounts = async (users) => {
      const counts = {};
      for (const user of users) {
          const chatId = [currentUser.uid, user.userId].sort().join('-');
          const messagesRef = ref(database, `chats/${chatId}/messages`);
          const snapshot = await get(messagesRef);
          let unreadCount = 0;
          snapshot.forEach((childSnapshot) => {
              const message = childSnapshot.val();
              // check if message is sent to the current user and is not read
              if (message.status === 'delivered') {
                  unreadCount++;
              }
          });
          counts[user.userId] = unreadCount;
      }
      setUnreadCounts(counts);
  };
  

    return (
      <>
      <div>
            <h2>Online Users</h2>
            <ListGroup>
                {onlineUsers.map(user => (
                    <ListGroup.Item key={user.userId} onClick={() => onSelectUser(user)}
                    style={{ backgroundColor: unreadCounts[user.userId] ? '#f8d7da' : 'transparent' }}>
                        {user.name || 'Anonymous'}
                        {/* {unreadCounts[user.userId] > 0 && <Badge bg="primary" className="ms-2">●</Badge>} */}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
        <div>
          <h2>Offline Users</h2>
            <ListGroup>
                {offlineUsers.map(user => (
                    <ListGroup.Item key={user.userId} onClick={() => onSelectUser(user)}
                        style={{ backgroundColor: unreadCounts[user.userId] > 0 ? '#f8d7da' : 'transparent' }}>
                        {user.name || 'Anonymous'}
                        {/* {unreadCounts[user.userId] > 0 && <Badge bg="primary" className="ms-2">●</Badge>} */}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
      </>  
    );
}

export default OnlineUsers;
