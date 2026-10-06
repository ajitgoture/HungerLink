const mongoose = require('mongoose');

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

const connectDB = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return;

  isConnecting = true;
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hungerlink_donation_db';
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
    });
    reconnectDelay = 5000;
    console.log(`[MongoDB Connected]: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.log(`[MongoDB Note]: Retrying connection in ${Math.ceil(reconnectDelay / 1000)} seconds.`);
    scheduleReconnect();
  } finally {
    isConnecting = false;
  }
};

module.exports = connectDB;
