// utils/nonSupportCache.js

// In-memory cache for non-support channel IDs
const nonSupportChannelIds = new Set();

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
  console.log("🧹 nonSupportChannelIds cache has been reset!");
}

/**
 * Get the current size of the cache.
 * @returns {number}
 */
function size() {
  return nonSupportChannelIds.size;
}

module.exports = { add, has, reset, size };