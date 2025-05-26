const { sendPrivateMessage } = require("./messageUtils");
const { SUPPORT_USER_IDS, LOG_MESSAGES, INACTIVITY_THRESHOLDS } = require("../config");
const nonSupportCache = require("./nonSupportCache");

/**
 * Main function to gather activity for all channels created by users in SUPPORT_USER_IDS.
 * @param {App} app - Slack Bolt app instance
 */
async function getAllChannelActivity(app) {
  console.log(LOG_MESSAGES.FUNCTION_START);

  try {
    console.log(LOG_MESSAGES.FETCH_LIST);
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

// Ici, tu utilises allChannels pour la suite
console.log("Channels returned by conversations.list:");
console.log(LOG_MESSAGES.RETRIEVE_LIST(allChannels.length));
/*allChannels.forEach(c =>
  console.log(`- ${c.name} (ID: ${c.id}) | creator: ${c.creator} | created: ${new Date(c.created * 1000).toISOString()}`)
);*/
    // Map to group channels by creator 
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
    
    //reset cache
    nonSupportCache.reset();
    
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
 * Fetches the real name of a user by userId.
 */
async function getUserName(app, userId) {
  console.log(`🚀 [START] getUserName(userId: ${userId})`);
  try {
    const response = await app.client.users.info({ user: userId });
    console.log(`✅ Retrieved user info: ${response.user.real_name} (${response.user.name})`);
    return response.user.real_name || response.user.name;
  } catch (error) {
    console.error(`❌ Error retrieving name for user ${userId}:`, error);
    return `User_${userId}`;
  }
}

/**
 * Ensures the bot is in all channels for a user, then sends the activity report.
 */
async function processUserChannels(app, userId, channels) {
  console.log(`👤 [START] Processing channels for user: ${userId} (${channels.length} channels)`);
  try {
    const userInfo = await app.client.users.info({ user: userId });
    console.log(`✅ ${LOG_MESSAGES.GROUP_CHECK} (User ID: ${userId})`);

    for (const channel of channels) {
      console.log(`🔎 Checking if bot is in channel: ${channel.name} (ID: ${channel.id})`);
      const botInChannel = await isBotInChannel(app, channel.id);

      if (!botInChannel) {
        console.log(`➕ Adding bot to channel: ${channel.name}`);
        await app.client.conversations.join({ channel: channel.id });
      } else {
        console.log(`✔️ Bot already in channel: ${channel.name}`);
      }
    }

    console.log(`📊 Generating activity report for user: ${userId}`);
    await getChannelActivityForUser(app, userId, channels);

    console.log(`✅ [END] processUserChannels for user: ${userId}`);
  } catch (error) {
    console.error(`❌ Error in processUserChannels for user ${userId}:`, error);
  }
}

/**
 * Checks if the bot is a member of a given channel.
 */
async function isBotInChannel(app, channelId) {
  console.log(`🛠 Checking if bot is in channel: ${channelId}`);
  try {
    const members = await app.client.conversations.members({ channel: channelId });
    const botUserId = await app.client.auth.test();
    const isPresent = members.members.includes(botUserId.user_id);
    console.log(`🔍 Bot ${isPresent ? "IS" : "IS NOT"} in channel ${channelId}`);
    return isPresent;
  } catch (error) {
    console.error(`❌ Error checking bot membership in channel ${channelId}:`, error);
    return false;
  }
}

/**
 * Gathers activity for each channel and sends a report to the user.
 */
async function getChannelActivityForUser(app, userId, channels) {
  console.log(`📊 [START] Gathering activity report for user: ${userId}`);
  try {
    const now = Date.now();
    const reportDate = new Date();
    const formattedDate = reportDate.toLocaleDateString();
    const formattedTime = reportDate.toLocaleTimeString();
    const userName = await getUserName(app, userId);

    console.log(`👤 Preparing report for: ${userName} (ID: ${userId})`);

    // Prepare activity groups based on inactivity thresholds
    const groupedActivity = {};
    INACTIVITY_THRESHOLDS.forEach(t => groupedActivity[`${t.days}+`] = { emoji: t.emoji, channels: [] });

    for (const channel of channels) {
      console.log(`📡 Fetching history for channel: ${channel.name} (ID: ${channel.id})`);
      try {
        const history = await app.client.conversations.history({
          channel: channel.id,
          limit: 100,
        });

        // Filter out join messages
        const filteredMessages = history.messages.filter(
          message => !message.subtype || message.subtype !== "channel_join"
        );

        let daysSinceLastMessage = 0;
        if (filteredMessages.length > 0) {
          const lastMessageTime = new Date(parseFloat(filteredMessages[0].ts) * 1000).getTime();
          daysSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60 * 24);
          console.log(`📅 Last message in ${channel.name} was ${Math.round(daysSinceLastMessage)} days ago`);
        } else {
          const creationDate = new Date(channel.created * 1000).getTime();
          daysSinceLastMessage = (now - creationDate) / (1000 * 60 * 60 * 24);
          console.log(`📅 No messages found in ${channel.name}, channel created ${Math.round(daysSinceLastMessage)} days ago`);
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
        console.error(`❌ Error retrieving history for channel ${channel.name}:`, error);
      }
    }

    // Build the report message
    let message = `Hi ${userName}! Here is your Slack room activity report:\n\n`;
    for (const [key, value] of Object.entries(groupedActivity)) {
      if (value.channels.length > 0) {
        message += `${value.emoji} Inactive for ${key} days:\n\t${value.channels.join("\n\t")}\n\n`;
      }
    }
    message += `Report generated on ${formattedDate} - ${formattedTime}.`;

    console.log(`📨 Sending report to ${userId}`);
    await sendPrivateMessage(app, userId, message);

    console.log(`✅ [END] Activity report sent to ${userId}`);
  } catch (error) {
    console.error(`❌ Error in getChannelActivityForUser for user ${userId}:`, error);
  }
}

module.exports = { getAllChannelActivity };