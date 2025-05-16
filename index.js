const { App, LogLevel } = require("@slack/bolt");
require("dotenv").config();

const { logBotPermissions } = require("./utils/auth");
const { getAllChannelActivity, getChannelActivityForUser } = require("./utils/channelUtils");
const { sendPrivateMessage } = require("./utils/messageUtils");
const { sleep } = require("./utils/rateLimiter");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
});

const INTERVAL_IN_HOURS = 24 * 7; // 7 jours
const INTERVAL_IN_MS = INTERVAL_IN_HOURS * 60 * 60 * 1000;

(async () => {
  console.log("Lancement initial du bot...");
  await getAllChannelActivity(app);

  const msToHumanReadable = (ms) => {
  const hours = ms / (1000 * 60 * 60);
  if (hours % 24 === 0) {
    return `${hours / 24} day(s)`;
  } else {
    return `${hours} hour(s)`;
  }
};

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

const intervalReadable = msToHumanReadable(INTERVAL_IN_MS);
const nextExecution = formatDate(Date.now() + INTERVAL_IN_MS);

console.log(`✅ Your bot is running every ${intervalReadable} - next review at ${nextExecution}`);

  
  // Lancer automatiquement toutes les semaines
  setInterval(async () => {
    console.log("Lancement hebdomadaire du bot...");
    await getAllChannelActivity(app);
  }, INTERVAL_IN_MS);
})();

const express = require("express");
const appExpress = express();
const PORT = process.env.PORT || 3000;

appExpress.get("/", (req, res) => {
  res.send("🤖 Bot is running");
});

appExpress.listen(PORT, () => {
  console.log(`🌐 Express server is listening on port ${PORT}`);
});