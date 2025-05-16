const { sendPrivateMessage } = require("./messageUtils");
const { sleep } = require("./rateLimiter");

async function getAllChannelActivity(app) {
  try {
    const result = await app.client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 1000,
    });

    const creatorRoomsMap = new Map();

    result.channels.forEach((channel) => {
      const creatorId = channel.creator;
      if (!creatorRoomsMap.has(creatorId)) {
        creatorRoomsMap.set(creatorId, []);
      }
      creatorRoomsMap.get(creatorId).push(channel);
    });

    for (const [creatorId, channels] of creatorRoomsMap) {
      await getChannelActivityForUser(app, creatorId, channels);
      await sleep(1000);
    }
  } catch (error) {
    console.error('Error while retrieving the channel list:', error);
  }
}

async function getChannelActivityForUser(app, userId, channels) {
  try {
    const now = Date.now();
    let userActivity = [];

    const reportDate = new Date();
    const formattedDate = reportDate.toLocaleDateString();
    const formattedTime = reportDate.toLocaleTimeString();

    const messageWithTimestamp = `(${formattedDate} - ${formattedTime})`;

    for (const channel of channels) {
      try {
        const history = await app.client.conversations.history({
          channel: channel.id,
          limit: 100,
        });

        const filteredMessages = history.messages.filter(
          message => !message.subtype || message.subtype !== 'channel_join'
        );

        let daysSinceLastMessage = 0;
        if (filteredMessages.length > 0) {
          const lastMessageTime = new Date(parseFloat(filteredMessages[0].ts) * 1000).getTime();
          daysSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60 * 24);
        }

        userActivity.push(`#${channel.name} - ${daysSinceLastMessage > 5 ? `${Math.round(daysSinceLastMessage)} days without activity` : "up-to-date (less than 5 days of inactivity)"}`);
      } catch (error) {
        console.error(`Error while retrieving history from channel ${channel.name}:`, error);
      }
    }

    if (userActivity.length > 0) {
      const message = `Channel Activity Report ${messageWithTimestamp}:\n${userActivity.join("\n")}`;
      console.log(`Sending message to user ${userId}: ${message}`); // Log pour vérifier le contenu du message

      await sendPrivateMessage(app, userId, message);
      console.log(`Message sent to user ${userId} at ${messageWithTimestamp}`); // Log pour confirmer l'envoi
      
      console.log('\n------------------\n'); // Ligne de séparation dans les logs
    }
  } catch (error) {
    console.error('Error while retrieving the channel list:', error);
  }
}

module.exports = { getAllChannelActivity, getChannelActivityForUser };
