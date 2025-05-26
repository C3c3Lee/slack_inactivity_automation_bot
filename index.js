const { App, LogLevel } = require("@slack/bolt");
require("dotenv").config();

const { logBotPermissions } = require("./utils/auth");
const { getAllChannelActivity } = require("./utils/channelUtils");
const { sendPrivateMessage } = require("./utils/messageUtils");
const { sleep } = require("./utils/rateLimiter");
const { LOG_MESSAGES } = require("./config");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
});

// Interval in hours for the report (default: 7 days)
const INTERVAL_IN_HOURS = 24 * 7;
const INTERVAL_IN_MS = INTERVAL_IN_HOURS * 60 * 60 * 1000;

// Helper to convert ms to human-readable format
const msToHumanReadable = (ms) => {
  const hours = ms / (1000 * 60 * 60);
  if (hours % 24 === 0) {
    return `${hours / 24} day(s)`;
  } else {
    return `${hours} hour(s)`;
  }
};

// Helper to format date in Paris timezone
const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

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
const express = require("express");
const appExpress = express();
const PORT = process.env.PORT || 3000;

appExpress.get("/", (req, res) => {
  res.send("🤖 Bot is running");
});

appExpress.listen(PORT, () => {
  console.log(`🌐 Express server is listening on port ${PORT}`);
});
