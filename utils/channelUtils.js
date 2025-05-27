/**
 * ===========================
 *   Dailymotion Slack Bot
 *   utils/channelUtils.js
 * ===========================
 *
 * Main logic for fetching, filtering, and processing Slack channels created by Support members.
 * - Lists all public, non-archived channels (with pagination).
 * - Filters channels by creator (SUPPORT_USER_IDS from config).
 * - Caches non-support channels in memory for performance.
 * - Ensures the bot is a member of each relevant channel.
 * - Gathers inactivity data and sends a report to each Support member.
 *
 * Rate limiting:
 * - Slack API rate limits are handled via the rateLimiter utility (see usage below).
 *
 * Configurable elements (in config.js):
 * - SUPPORT_USER_IDS
 * - LOG_MESSAGES
 * - INACTIVITY_THRESHOLDS
 *
 * Author: Celia Longlade
 * Last updated: 2025-05-26
 */
const { sendPrivateMessage } = require("./messageUtils");
const { SUPPORT_USER_IDS, LOG_MESSAGES, INACTIVITY_THRESHOLDS } = require("../config");
const nonSupportCache = require("./nonSupportCache");
const { slackApiCallWithRateLimit } = require("./rateLimiter");


// In-memory cache for user names to avoid redundant API calls
const userNameCache = {};

/**
 * Main function to gather activity for all channels created by users in SUPPORT_USER_IDS.
 * @param {App} app - Slack Bolt app instance
 */
async function getAllChannelActivity(app) {
  console.log(LOG_MESSAGES.FUNCTION_START);

  try {
    console.log(LOG_MESSAGES.FETCH_LIST);

    // Fetch all public, non-archived channels with pagination
    let allChannels = [];
    let cursor;
    do {
      const result = await app.client.conversations.list({
        types: "public_channel",
        limit: 1000,
        cursor,
        exclude_archived: true,
      });

      allChannels = allChannels.concat(result.channels);

      cursor = result.response_metadata?.next_cursor;
    } while (cursor);

    console.log(LOG_MESSAGES.RETRIEVE_LIST(allChannels.length));

    // Group channels by creator (only Support members)
    const creatorRoomsMap = new Map();

    for (const channel of allChannels) {
      if (nonSupportCache.has(channel.id)) {
        console.log(`⏭️ Skipping channel ${channel.name} (ID: ${channel.id}) - previously marked as non-support`);
        continue;
      }
      //console.log(`🔍 Checking channel: ${channel.name} (ID: ${channel.id}), created by ${channel.creator}`);
      // 1. Check if the channel is public (already filtered by conversations.list)
      // 2. Check if the creator is a Support member
      // Only consider channels created by users in SUPPORT_USER_IDS
      if (SUPPORT_USER_IDS.includes(channel.creator)) {
        const creatorName = await getUserName(app, channel.creator);
        console.log(`🔍 Channel ${channel.name} (ID: ${channel.id}) belongs to ${creatorName} (ID: ${channel.creator})`);
        
        if (!creatorRoomsMap.has(channel.creator)) {
          creatorRoomsMap.set(channel.creator, []);
        }
        creatorRoomsMap.get(channel.creator).push(channel);
      } else {
        nonSupportCache.add(channel.id);
        console.log(`🚫 Channel ${channel.name} (ID: ${channel.id}) is not created by a support member. Marked as non-support.`);
      }
    }
    
    console.log(`📌 Found ${creatorRoomsMap.size} unique creators.`);

    // For each creator, process their channels
    for (const [creatorId, channels] of creatorRoomsMap) {
      console.log(`📨 Processing ${channels.length} channels for creator: ${creatorId}`);
      await processUserChannels(app, creatorId, channels);
    }

    console.log(`✅ [END] getAllChannelActivity()`);
  } catch (error) {
    console.error("❌ Error while retrieving channel list:", error);
  }
}

/**
 * Fetches the real name of a user by userId, with in-memory cache.
 * @param {App} app - Slack Bolt app instance
 * @param {string} userId - Slack user ID
 * @returns {Promise<string>}
 */
async function getUserName(app, userId) {
  if (userNameCache[userId]) {
    return userNameCache[userId];
  }
  console.log(`🚀 [START] getUserName(userId: ${userId})`);
  try {
    const response = await slackApiCallWithRateLimit(
      (...args) => app.client.users.info(...args),
      { user: userId }
    );
    const name = response.user.real_name || response.user.name;
    userNameCache[userId] = name;
    console.log(`✅ Retrieved user info: ${name} (${response.user.name})`);
    return name;
  } catch (error) {
    console.error(`❌ Error retrieving name for user ${userId}:`, error);
    return `User_${userId}`;
  }
}

/**
 * Ensures the bot is in all channels for a user, then sends the activity report.
 * @param {App} app - Slack Bolt app instance
 * @param {string} userId - Slack user ID
 * @param {Array} channels - Array of channel objects
 */
async function processUserChannels(app, userId, channels) {
  const { LOG_MESSAGES } = require("../config");
  const userName = await getUserName(app, userId);

  console.log(LOG_MESSAGES.GROUP_CHECK(userName, userId));

  try {
    for (const channel of channels) {
      console.log(LOG_MESSAGES.BOT_CHECK(channel.name, channel.id));
      const botInChannel = await isBotInChannel(app, channel.id);

      if (!botInChannel) {
        try {
          await slackApiCallWithRateLimit(
            (...args) => app.client.conversations.join(...args),
            { channel: channel.id }
          );
          console.log(LOG_MESSAGES.BOT_JOINED(channel.name, channel.id));
        } catch (err) {
          console.error(LOG_MESSAGES.BOT_JOIN_FAILED(channel.name, channel.id, err.data?.error || err.message));
          continue; // Skip activity processing for this channel
        }
      } else {
        console.log(LOG_MESSAGES.BOT_ALREADY_PRESENT(channel.name));
      }
    }

    console.log(LOG_MESSAGES.GENERATE_REPORT(userId));
    await getChannelActivityForUser(app, userId, channels);
    console.log(LOG_MESSAGES.END_PROCESS_USER(userId));
  } catch (error) {
    console.error(LOG_MESSAGES.ERROR_PROCESS_USER(userId, error));
  }
}

/**
 * Checks if the bot is a member of a given channel.
 * @param {App} app - Slack Bolt app instance
 * @param {string} channelId - Slack channel ID
 * @returns {Promise<boolean>}
 */
async function isBotInChannel(app, channelId) {
  //console.log(`🛠 Checking if bot is in channel: ${channelId}`);
  try {
    const members = await slackApiCallWithRateLimit(
      (...args) => app.client.conversations.members(...args),
      { channel: channelId }
    );
    const botUserId = (await slackApiCallWithRateLimit(
      (...args) => app.client.auth.test(...args)
    )).user_id;
    const isPresent = members.members.includes(botUserId);
    //console.log(`🔍 Bot ${isPresent ? "IS" : "IS NOT"} in channel ${channelId}`);
    return isPresent;
  } catch (error) {
    console.error(`❌ Error checking bot membership in channel ${channelId}:`, error);
    return false;
  }
}


/**
 * Gathers activity for each channel and sends a report to the user.
 * @param {App} app - Slack Bolt app instance
 * @param {string} userId - Slack user ID
 * @param {Array} channels - Array of channel objects
 */
async function getChannelActivityForUser(app, userId, channels) {
  const { INACTIVITY_THRESHOLDS, LOG_MESSAGES } = require("../config");
  const { REPORT_MESSAGE_TEMPLATE, ACTIVITY_BLOCK_TEMPLATE } = require("../config");

  console.log(LOG_MESSAGES.START_ACTIVITY_REPORT(userId));

  try {
    const now = Date.now();
    const reportDate = new Date();
    const formattedDate = reportDate.toLocaleDateString();
    const formattedTime = reportDate.toLocaleTimeString();
    const userName = await getUserName(app, userId);

    console.log(LOG_MESSAGES.PREPARE_REPORT(userName, userId));

    // Prepare activity groups based on inactivity thresholds
    const groupedActivity = {};
    INACTIVITY_THRESHOLDS.forEach(t => groupedActivity[`${t.days}+`] = { emoji: t.emoji, channels: [] });

    for (const channel of channels) {
      console.log(LOG_MESSAGES.FETCH_HISTORY(channel.name, channel.id));

      try {
        const history = await slackApiCallWithRateLimit(
          (...args) => app.client.conversations.history(...args),
          { channel: channel.id, limit: 100 }
        );

        // Filter out join messages
        const filteredMessages = history.messages.filter(
          message => !message.subtype || message.subtype !== "channel_join"
        );

        let daysSinceLastMessage = 0;
        if (filteredMessages.length > 0) {
          const lastMessageTime = new Date(parseFloat(filteredMessages[0].ts) * 1000).getTime();
          daysSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60 * 24);
          console.log(LOG_MESSAGES.LAST_MESSAGE(channel.name, Math.round(daysSinceLastMessage)));
        } else {
          const creationDate = new Date(channel.created * 1000).getTime();
          daysSinceLastMessage = (now - creationDate) / (1000 * 60 * 60 * 24);
          console.log(LOG_MESSAGES.NO_MESSAGE(channel.name, Math.round(daysSinceLastMessage)));
        }

        const channelLink = `<slack://channel?id=${channel.id}|#${channel.name}> - inactive for ${Math.round(daysSinceLastMessage)} days`;

        // Assign channel to the correct inactivity group
        for (const threshold of INACTIVITY_THRESHOLDS) {
          if (daysSinceLastMessage > threshold.days) {
            groupedActivity[`${threshold.days}+`].channels.push(channelLink);
            break;
          }
        }
      } catch (error) {
        console.error(LOG_MESSAGES.ERROR_HISTORY(channel.name, error));
      }
    }

    // Build the report message
/*    let message = `Hi ${userName}! Here is your Slack room activity report:\n\n`;
    for (const [key, value] of Object.entries(groupedActivity)) {
      if (value.channels.length > 0) {
        message += `${value.emoji} Inactive for ${key} days:\n\t${value.channels.join("\n\t")}\n\n`;
      }
    }
    message += `Report generated on ${formattedDate} - ${formattedTime}.`;
*/
    let activityBlocks = "";
for (const [key, value] of Object.entries(groupedActivity)) {
  if (value.channels.length > 0) {
    activityBlocks += ACTIVITY_BLOCK_TEMPLATE({
      emoji: value.emoji,
      key,
      channels: value.channels
    });
  }
}

let message = REPORT_MESSAGE_TEMPLATE({
  userName,
  activityBlocks,
  date: formattedDate,
  time: formattedTime
});
    await sendPrivateMessage(app, userId, message);

    console.log(LOG_MESSAGES.END_ACTIVITY_REPORT(userId));
  } catch (error) {
    console.error(LOG_MESSAGES.ERROR_ACTIVITY_REPORT(userId, error));
  }
}

module.exports = { getAllChannelActivity };