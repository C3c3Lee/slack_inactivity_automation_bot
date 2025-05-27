/**
 * ===========================
 *   Dailymotion Slack Bot
 *   utils/rateLimiter.js
 * ===========================
 *
 * Utility to handle Slack API rate limits (HTTP 429).
 * If a rate limit is hit, waits for the recommended time (from the 'retry_after' field)
 * and retries the API call automatically.
 *
 * Usage:
 *   const { slackApiCallWithRateLimit } = require('./utils/rateLimiter');
 *   const result = await slackApiCallWithRateLimit(
 *     (...args) => app.client.conversations.history(...args),
 *     { channel: channel.id, limit: 100 }
 *   );
 *
 * Author: Celia Longlade
 * Last updated: 2025-05-26
 */

/**
 * Wraps a Slack API call and handles rate limiting (HTTP 429).
 * @param {Function} apiCall - The API call function (should return a Promise)
 * @param  {...any} args - Arguments to pass to the API call
 * @returns {Promise<any>} - The result of the API call
 */
async function slackApiCallWithRateLimit(apiCall, ...args) {
  while (true) {
    try {
      return await apiCall(...args);
    } catch (err) {
      // Slack returns err.data.retry_after (in seconds) on rate limit
      if (err.data && err.data.retry_after) {
        const waitMs = err.data.retry_after * 1000;
        console.warn(`⚠️ Slack rate limit hit. Waiting for ${waitMs / 1000}s before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      } else {
        // Not a rate limit error: rethrow
        throw err;
      }
    }
  }
}

module.exports = { slackApiCallWithRateLimit };