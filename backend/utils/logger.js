/**
 * Centralized logging utility
 * In production, only logs errors to reduce cloud logging costs
 * In development, logs everything for debugging
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

module.exports = logger;

