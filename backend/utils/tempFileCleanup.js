/**
 * Automatic cleanup of temporary files to save storage costs
 * Runs cleanup every hour to remove old temp files
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const TEMP_DIR = path.join(__dirname, '../temp');
const MAX_FILE_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Clean up old temporary files
 */
function cleanupTempFiles() {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      return;
    }

    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    let deletedCount = 0;
    let totalSizeFreed = 0;

    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > MAX_FILE_AGE_MS) {
          const fileSize = stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          totalSizeFreed += fileSize;
        }
      } catch (error) {
        // File might have been deleted already, ignore
        logger.debug(`Could not process file ${file}:`, error.message);
      }
    });

    if (deletedCount > 0) {
      logger.info(`🧹 Cleaned up ${deletedCount} temp files, freed ${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`);
    }
  } catch (error) {
    logger.error('Error cleaning up temp files:', error);
  }
}

// Run cleanup every hour
if (process.env.NODE_ENV === 'production') {
  // Run immediately on startup
  cleanupTempFiles();
  
  // Then run every hour
  setInterval(cleanupTempFiles, 60 * 60 * 1000);
  
  logger.info('✅ Temp file cleanup scheduled (runs every hour)');
}

module.exports = { cleanupTempFiles };

