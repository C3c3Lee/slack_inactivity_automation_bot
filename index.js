/**
 * ===========================
 *   Dailymotion Slack Bot
 *   index.js
 * ===========================
 *
 * This file is the main entry point for the Slack bot.
 *
 * Scheduling logic:
 * - You can run the report immediately at startup (for testing/debug) by uncommenting the line:
 *     await getAllChannelActivity(app);
 * - The bot will always schedule periodic reports at the interval defined in config.js (REPORT_INTERVAL_HOURS).
 * - In production, you typically want only the scheduled reports.
 * - For local testing, you can enable both the immediate run and the scheduled interval.
 *
 * To change the report frequency, edit REPORT_INTERVAL_HOURS in config.js.
 *
 * Only one call to getAllChannelActivity(app) is needed per execution.
 * Do not uncomment both lines unless you want both an immediate and a scheduled run.
 *
 * Express is used to keep the bot alive on platforms like Glitch.
 *
 * Author: Celia Longlade
 * Last updated: 2025-05-26
 */
const { App, LogLevel } = require("@slack/bolt");
require("dotenv").config();

const express = require("express");
const { getAllChannelActivity } = require("./utils/channelUtils");
const { LOG_MESSAGES, REPORT_INTERVAL_HOURS, TIMEZONE } = require("./config");

// Initialize Slack Bolt app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
});


// Convert interval in hours to milliseconds
const INTERVAL_IN_MS = REPORT_INTERVAL_HOURS * 60 * 60 * 1000;

/**
 * Convert milliseconds to a human-readable format (days or hours)
 * @param {number} ms
 * @returns {string}
 */
const msToHumanReadable = (ms) => {
  const hours = ms / (1000 * 60 * 60);
  if (hours % 24 === 0) {
    return `${hours / 24} day(s)`;
  } else {
    return `${hours} hour(s)`;
  }
};


/**
 * Format a timestamp to Paris timezone
 * @param {number} timestamp
 * @returns {string}
 */
const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleString("fr-FR", { timeZone: TIMEZONE });

/**
 * Main bot loop: schedules the periodic report
 */
(async () => {
  console.log("Initial bot launch...");
  
  // Uncomment to run immediately at startup
  //await getAllChannelActivity(app);

  const intervalReadable = msToHumanReadable(INTERVAL_IN_MS);
  const nextExecution = formatDate(Date.now() + INTERVAL_IN_MS);
  
  console.log(`✅ Your bot is running every ${intervalReadable} - next review at ${nextExecution}`);

  // Schedule the report at the defined interval
  setInterval(async () => {
    console.log("Weekly bot launch...");
  //await getAllChannelActivity(app);
  }, INTERVAL_IN_MS);
})();

// Express server to keep the bot alive (for platforms like Glitch)
const appExpress = express();
const PORT = process.env.PORT || 3000;

appExpress.get("/", (req, res) => {
  res.send("🤖 Bot is running");
});

appExpress.listen(PORT, () => {
  console.log(`🌐 Express server is listening on port ${PORT}`);
});

/*
// For manual cache reset (testing/maintenance only)
const resetNonSupportCache = require('./utils/resetNonSupportCache');

// Call this line ONLY when you want to clear the cache (not in production loop)
resetNonSupportCache();
*/