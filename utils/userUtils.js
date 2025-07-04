/**
 * ===========================
 *   Dailymotion Slack Bot
 *   utils/resetNonSupportCache.js
 * ===========================
 *
 * Utility script to reset the in-memory cache of non-support channels.
 * Use this script ONLY for testing or maintenance purposes.
 * 
 * Usage:
 *   - Run manually from index.js or another script when you want to clear the cache.
 *   - Not called automatically in production.
 *
 * Example (in index.js):
 *   const resetNonSupportCache = require('./utils/resetNonSupportCache');
 *   resetNonSupportCache();
 *
 * Author: Celia Longlade & AI pair programmer
 * Last updated: 2025-05-26
 */

const nonSupportCache = require('./nonSupportCache');

const { logToFile } = require("./logger"); 

/**
 * Resets the nonSupportChannelIds cache.
 */
function resetNonSupportCache() {
  nonSupportCache.reset();
  logToFile("🧹 nonSupportChannelIds cache has been reset (manual action).");
}

module.exports = resetNonSupportCache;