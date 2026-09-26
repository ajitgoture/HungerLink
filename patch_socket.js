const fs = require('fs');

const path = 'server/sockets/socketHandler.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /socket\.on\('JOIN_USER_ROOM', \(data\) => \{[\s\S]*?\}\);/,
  `socket.on('JOIN_USER_ROOM', (data) => {
      try {
        const payload = typeof data === 'string' ? { userId: data } : data;
        const { userId, token } = payload;
        
        if (!token) throw new Error('No token provided');
        if (!userId) throw new Error('No userId provided');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        
        // Strict Security: Users can only join their OWN room!
        if (decoded.id.toString() !== userId.toString()) {
          throw new Error('Unauthorized room join attempt');
        }
        
        socket.join(\`user_\${userId}\`);
        socket.userId = userId;
        console.log(\`[Socket]: User \${userId} authenticated and joined room user_\${userId}\`);
      } catch (err) {
        console.error('[Socket Auth Error]:', err.message);
      }
    });`
);

content = content.replace(
  /socket\.on\('JOIN_ROLE_ROOM', \(data\) => \{[\s\S]*?\}\);/,
  `socket.on('JOIN_ROLE_ROOM', (data) => {
      try {
        const payload = typeof data === 'string' ? { role: data } : data;
        const { role, token } = payload;
        
        if (!token) throw new Error('No token provided');
        if (!role) throw new Error('No role provided');
        
        jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        
        socket.join(\`role_\${role.toLowerCase().replace(/\\s+/g, '_')}\`);
        socket.userRole = role;
        console.log(\`[Socket]: Joined role room: role_\${role.toLowerCase().replace(/\\s+/g, '_')}\`);
      } catch (err) {
        console.error('[Socket Role Auth Error]:', err.message);
      }
    });`
);

fs.writeFileSync(path, content);
console.log('Patched socketHandler.js auth vulnerability.');
