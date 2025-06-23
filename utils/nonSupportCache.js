/**
 * ===========================
 *   Dailymotion Slack Bot
 *   utils/nonSupportCache.js
 * ===========================
 *
 * In-memory cache for non-support channel IDs.
 *
 * - Used to store the IDs of channels that are not created by Support members,
 *   so they can be skipped in subsequent runs for performance.
 * - The cache is volatile: it is reset on process restart or by calling reset().
 * - Not persisted between runs (by design).
 *
 * Usage:
 *   - add(channelId): Add a channel ID to the cache.
 *   - has(channelId): Check if a channel ID is in the cache.
 *   - reset(): Clear all entries from the cache (manual or via a dedicated script).
 *   - size(): Get the current size of the cache.
 *
 * Author: Celia Longlade & AI pair programmer
 * Last updated: 2025-05-26
 */

// In-memory cache for non-support channel IDs
const nonSupportChannelIds = new Set();

const { logToFile } = require("./logger"); 

/**
 * Add a channel ID to the cache.
 * @param {string} channelId
 */
function add(channelId) {
  nonSupportChannelIds.add(channelId);
}

/**
 * Check if a channel ID is in the cache.
 * @param {string} channelId
 * @returns {boolean}
 */
function has(channelId) {
  return nonSupportChannelIds.has(channelId);
}

/**
 * Reset the cache (clear all entries).
 */
function reset() {
  nonSupportChannelIds.clear();
  logToFile("🧹 nonSupportChannelIds cache has been reset!");
}

/**
 * Get the current size of the cache.
 * @returns {number}
 */
function size() {
  return nonSupportChannelIds.size;
}

module.exports = { add, has, reset, size };