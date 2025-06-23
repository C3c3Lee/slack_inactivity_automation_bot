/**
 * ===========================
 *   Dailymotion Slack Bot
 *   utils/auth.js
 * ===========================
 *
 * Utility function for debugging and auditing the bot's permissions (OAuth scopes).
 *
 * Usage:
 * - Call logBotPermissions(app) to print the current bot token's scopes to the console.
 * - This can help diagnose permission issues or verify the bot's installation.
 * - Not used in production flow, but useful for debugging or during deployment.
 *
 * To use:
 *   const { logBotPermissions } = require("./utils/auth");
 *   await logBotPermissions(app);
 *
 * Author: Celia Longlade & AI pair programmer
 * Last updated: 2025-06-04
 */

const { logToFile } = require("./logger"); 

async function logBotPermissions(app) {
  logToFile("2. Function: logBotPermissions()");
  try {
    const authResult = await app.client.auth.test();
    // Note: response_metadata.scopes may not always be present depending on the API version and token type.
    if (authResult.response_metadata && authResult.response_metadata.scopes) {
      logToFile("Bot Permissions (scopes):", authResult.response_metadata.scopes);
    } else {
      logToFile("Bot Permissions: Could not retrieve scopes from response_metadata. Check your token type or Slack API version.");
      logToFile("Full auth.test result:", authResult);
    }
  } catch (error) {
    logToFile("Error retrieving bot permissions:", error);
  }
}

module.exports = { logBotPermissions };
