/**
 * ===========================
 *   Dailymotion Slack Bot
 *   utils/logger.js
 * ===========================
 *
 * Utility for logging messages to a persistent file (and to the console).
 * - Log file name and directory are fully configurable in config.js.
 * - The [datetime] placeholder in the file name is replaced by the current date and time (YYYYMMDD-HHmmss).
 * - Optionally sets log files to read-only after each write (configurable).
 * - Ensures logs directory exists.
 *
 * Usage:
 *   const { logToFile } = require('./utils/logger');
 *   logToFile("Your log message");
 *
 * Configuration:
 *   - LOGS_DIR: directory for log files (see config.js)
 *   - LOG_FILE_NAME_PATTERN: file name pattern with [datetime] placeholder (see config.js)
 *   - LOG_FILE_READONLY: true/false (see config.js)
 *
 * Author: Celia Longlade & AI pair programmer
 * Last updated: 2025-06-04
 */

const fs = require('fs');
const path = require('path');
const { LOGS_DIR, LOG_FILE_NAME_PATTERN, LOG_FILE_READONLY } = require('../config');

/**
 * Returns the log file path using the pattern from config.js.
 * [datetime] is replaced by current date and time (YYYYMMDD-HHmmss).
 * @returns {string}
 */
function getLogFilePath() {
  const now = new Date();
  const datetime =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const fileName = LOG_FILE_NAME_PATTERN.replace('[datetime]', datetime);
  return path.join(LOGS_DIR, fileName);
}

/**
 * Logs a message to the log file (and to the console).
 * Sets the file to read-only if configured.
 * @param {string} message
 */
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  const filePath = getLogFilePath();

  // Ensure logs directory exists
  try { 
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch (err) {
    // Tu peux garder ce log d'erreur car il est critique
    console.error(`[logger] Could not create log directory: ${err.message}`);
    return;
  }

  // Append log to file
  fs.appendFileSync(filePath, logLine, 'utf8');

  // Optionally set file to read-only (0444)
  if (LOG_FILE_READONLY) {
    try {
      fs.chmodSync(filePath, 0o444);
    } catch (err) {
      // Ce warning peut rester en console, il est rare et utile
      console.warn(`[logger] Could not set log file to read-only: ${err.message}`);
    }
  }

  // REMOVE or comment out this line to avoid duplicate logs in the console:
  // console.log(logLine.trim());
}

module.exports = { logToFile };