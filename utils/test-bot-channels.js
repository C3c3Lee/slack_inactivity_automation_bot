/*
require("dotenv").config();
const { App, LogLevel } = require("@slack/bolt");

// Remplace par tes IDs de channels à tester
const CHANNEL_IDS_TO_TEST = [
  "C08TTQEC343", // récent, bot ajouté à la main
  "C081E9ACF43", // ancien, bot non ajouté
];

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
});

(async () => {
  try {
    // 1. Liste tous les channels publics visibles par le bot
    const result = await app.client.conversations.list({
      types: "public_channel",
      limit: 1000,
      exclude_archived: true,
    });
    const allChannels = result.channels;
const info = await app.client.conversations.info({ channel: "C08TTQEC343" });
console.log(info);
    for (const channelId of CHANNEL_IDS_TO_TEST) {
      const channel = allChannels.find(c => c.id === channelId);

      if (!channel) {
        console.log(`❌ Channel ID ${channelId} NOT FOUND in conversations.list result.`);
        continue;
      }

      console.log(`✅ Channel found: ${channel.name} (ID: ${channel.id})`);

      // 2. Vérifie si le bot est membre
      let isMember = false;
      try {
        const members = await app.client.conversations.members({ channel: channelId });
        const botUserId = (await app.client.auth.test()).user_id;
        isMember = members.members.includes(botUserId);
        console.log(`   - Bot is ${isMember ? "" : "NOT "}a member of this channel.`);
      } catch (err) {
        console.error(`   ❌ Error checking membership for ${channelId}:`, err.data?.error || err.message);
        continue;
      }

      // 3. Si non membre, tente de rejoindre
      if (!isMember) {
        try {
          await app.client.conversations.join({ channel: channelId });
          console.log(`   ➕ Bot successfully joined channel ${channel.name} (${channelId})`);
        } catch (err) {
          console.error(`   ❌ Bot could NOT join channel ${channel.name} (${channelId}):`, err.data?.error || err.message);
        }
      }
    }
  } catch (error) {
    console.error("Global error:", error);
  }
  await app.client.conversations.join({ channel: "C081E9ACF43" });
})();
*/