const pino = require('pino');

// Create a pino logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { env: process.env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
