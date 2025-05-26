/**
 * Sends a private message to a user.
 * @param {App} app - Slack Bolt app instance
 * @param {string} userId - Slack user ID
 * @param {string} message - Message to send
 */
async function sendPrivateMessage(app, userId, message) {
  try {
    // Retrieve user info (optional, for logging)
    const userInfo = await app.client.users.info({ user: userId });
    const userName = userInfo.user.profile.display_name || userInfo.user.real_name || userInfo.user.name;

    // Open a direct conversation with the user
    const conversation = await app.client.conversations.open({ users: userId });

    // Send the message in the direct conversation
    await app.client.chat.postMessage({
      channel: conversation.channel.id,
      text: message,
    });

    // Detailed log with content and time
    console.log(`Message sent to ${userName} (User ID: ${userId}) in ${conversation.channel.id}:\n${message}`);
  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
  }
}

module.exports = { sendPrivateMessage };