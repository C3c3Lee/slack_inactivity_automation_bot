const { sendPrivateMessage } = require("./messageUtils");
//const { sleep } = require("./rateLimiter");
const { SUPPORT_CHANNEL_ID, LOG_MESSAGES } = require("../config");

async function getAllChannelActivity(app) {
    console.log(LOG_MESSAGES.FUNCTION_START); 

    try {
        console.log(LOG_MESSAGES.FETCH_LIST);
        const result = await app.client.conversations.list({
            types: "public_channel,private_channel",
            limit: 10000,
        });

        console.log(LOG_MESSAGES.RETRIEVE_LIST(result.channels.length));
        const creatorRoomsMap = new Map();

        for (const channel of result.channels) {
            console.log(`🔍 Checking channel: ${channel.name} (ID: ${channel.id}), created by ${channel.creator}`);
          
            for(var i= 0; i < SUPPORT_CHANNEL_ID.length; i++)
            {
                 if(SUPPORT_CHANNEL_ID[i]===channel.creator){
                    (`🔍 Support member ${channel.name} detected`);
            if (!creatorRoomsMap.has(channel.creator)) {
                creatorRoomsMap.set(channel.creator, []);
            }
            creatorRoomsMap.get(channel.creator).push(channel);
                 }
            }

        }

        console.log(`📌 Found ${creatorRoomsMap.size} unique creators.`);
        for (const [creatorId, channels] of creatorRoomsMap) {
            console.log(`📨 Processing ${channels.length} channels for creator: ${creatorId}`);
            await processUserChannels(app, creatorId, channels);
        }

        console.log(`✅ [END] getAllChannelActivity()`);
    } catch (error) {
        console.error("❌ Error while retrieving channel list:", error);
    }
}

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

async function getChannelActivityForUser(app, userId, channels) {
    console.log(`📊 [START] Gathering activity report for user: ${userId}`);

    try {
        const now = Date.now();
        const reportDate = new Date();
        const formattedDate = reportDate.toLocaleDateString();
        const formattedTime = reportDate.toLocaleTimeString();

        const userName = await getUserName(app, userId);
        console.log(`👤 Preparing report for: ${userName} (ID: ${userId})`);

        const groupedActivity = {
            "60+": { emoji: ":red_circle:", channels: [] },
            "30+": { emoji: ":large_orange_circle:", channels: [] },
            "15+": { emoji: ":large_yellow_circle:", channels: [] },
            "5+": { emoji: ":large_green_circle:", channels: [] },
        };

        for (const channel of channels) {
            console.log(`📡 Fetching history for channel: ${channel.name} (ID: ${channel.id})`);

            try {
                const history = await app.client.conversations.history({
                    channel: channel.id,
                    limit: 100,
                });

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

                if (daysSinceLastMessage > 60) {
                    groupedActivity["60+"].channels.push(channelLink);
                } else if (daysSinceLastMessage > 30) {
                    groupedActivity["30+"].channels.push(channelLink);
                } else if (daysSinceLastMessage > 15) {
                    groupedActivity["15+"].channels.push(channelLink);
                } else if (daysSinceLastMessage > 5) {
                    groupedActivity["5+"].channels.push(channelLink);
                }
            } catch (error) {
                console.error(`❌ Error retrieving history for channel ${channel.name}:`, error);
            }
        }

        let message = `Hi ${userName}! Here is your Slack room activity report:\n\n`;

        for (const [key, value] of Object.entries(groupedActivity)) {
            if (value.channels.length > 0) {
                message += `${value.emoji} Inactive for ${key} days:\n\t${value.channels.join("\n\t")}\n\n`;
            }
        }

        message += `Report generated on ${formattedDate} - ${formattedTime}.`;

        console.log(`📨 Sending report to ${userId}: \n${message}`);
        await sendPrivateMessage(app, userId, message);

        console.log(`✅ [END] Activity report sent to ${userId}`);
    } catch (error) {
        console.error(`❌ Error in getChannelActivityForUser for user ${userId}:`, error);
    }
}

module.exports = { getAllChannelActivity };
