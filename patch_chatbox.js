const fs = require('fs');

let content = fs.readFileSync('client/src/components/ChatBox.jsx', 'utf8');

// Inside the initChat useEffect, it emits JOIN_CHAT_ROOM once. 
// We want to add a reconnect listener to the second useEffect which depends on conversation.

const patchString = `
    const handleError = data => setError(data.message);
    
    // Add Reconnect Handler
    const handleReconnect = () => {
      const token = localStorage.getItem('token');
      socket.emit('JOIN_CHAT_ROOM', {
        conversationId: conversation._id,
        token
      });
    };
    
    socket.on('connect', handleReconnect);
    socket.on('chat:message_received', handleMessage);
`;

const replaceString = `
    const handleError = data => setError(data.message);
    socket.on('chat:message_received', handleMessage);
`;

if (!content.includes('handleReconnect')) {
  content = content.replace(replaceString, patchString);
  
  const patchCleanup = `
      socket.off('connect', handleReconnect);
      socket.off('chat:message_received', handleMessage);
  `;
  const replaceCleanup = `
      socket.off('chat:message_received', handleMessage);
  `;
  content = content.replace(replaceCleanup, patchCleanup);
  
  fs.writeFileSync('client/src/components/ChatBox.jsx', content);
  console.log('Patched ChatBox reconnect.');
} else {
  console.log('ChatBox already patched.');
}
