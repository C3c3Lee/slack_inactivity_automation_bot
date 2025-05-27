/**
 * ===========================
 *   Dailymotion Slack Bot
 *   utils/messageUtils.js
 * ===========================
 *
 * Utility for sending private messages to Slack bot app.
 *
 * - Opens a direct conversation with the user (if not already open)
 * - Sends the provided message
 * - Logs the action with user and channel info
 * - All log messages are centralized in config.js for consistency
 *
 * Author: Celia Longlade
 * Last updated: 2025-05-26
 */

const { LOG_MESSAGES } = require("../config");

/**
 * Sends a private message to a user.
 * @param {App} app - Slack Bot app instance
 * @param {string} userId - Slack user ID
 * @param {string} message - Message to send
 */
async function sendPrivateMessage(app, userId, message) {
  try {
    // Retrieve user info for logging
    const userInfo = await app.client.users.info({ user: userId });
    const userName =
      userInfo.user.profile.display_name ||
      userInfo.user.real_name ||
      userInfo.user.name;

    // Open a direct conversation with the user
    const conversation = await app.client.conversations.open({ users: userId });

    // Send the message in the direct conversation (Bot app)
    await app.client.chat.postMessage({
      channel: conversation.channel.id,
      text: message,
    });

    // Log with content and time (centralized in config.js)
    console.log(
      LOG_MESSAGES.MESSAGE_SENT(userName, userId, conversation.channel.id)
    );
  } catch (error) {
    console.error(LOG_MESSAGES.ERROR_SEND_DM(userId, error));
  }
}

module.exports = { sendPrivateMessage };