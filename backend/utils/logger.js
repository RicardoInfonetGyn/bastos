// ======================================================
// utils/logger.js
// ======================================================
const fs = require('fs').promises;
const path = require('path');

const logActivity = async (type, message, userId = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    message,
    userId
  };
  
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    await fs.mkdir(logDir, { recursive: true });
    
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Erro ao escrever log:', error);
  }
};

module.exports = { logActivity };