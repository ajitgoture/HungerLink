const mongoose = require('mongoose');

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/hungerlink_donation_db';
let reconnectTimer = null;
let reconnectDelay = 5000;
let isConnecting = false;

const scheduleReconnect = () => {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectDB();
  }, reconnectDelay);
  reconnectTimer.unref();
  reconnectDelay = Math.min(reconnectDelay * 2, 60000);
};

const getMongoUris = () => {
  const configuredUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_FALLBACK_URI || DEFAULT_LOCAL_URI;
  const candidates = [];

  if (configuredUri) candidates.push(configuredUri);
  if (fallbackUri && !candidates.includes(fallbackUri)) candidates.push(fallbackUri);
  if (!candidates.includes(DEFAULT_LOCAL_URI)) candidates.push(DEFAULT_LOCAL_URI);

  return [...new Set(candidates)];
};

const connectDB = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return;

  const candidateUris = getMongoUris();
  let lastError = null;

  for (const connStr of candidateUris) {
    isConnecting = true;
    try {
      const conn = await mongoose.connect(connStr, {
        serverSelectionTimeoutMS: 5000,
      });
      reconnectDelay = 5000;
      console.log(`[MongoDB Connected]: ${conn.connection.host} / ${conn.connection.name}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`[MongoDB Connection Error]: ${connStr} -> ${error.message}`);
    } finally {
      isConnecting = false;
    }
  }

  if (lastError) {
    console.log(`[MongoDB Note]: No reachable MongoDB instance found. Retrying connection in ${Math.ceil(reconnectDelay / 1000)} seconds.`);
    scheduleReconnect();
  }
};

module.exports = connectDB;
