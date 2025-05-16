const { sendPrivateMessage } = require("./messageUtils");
const { sleep } = require("./rateLimiter");

async function getUserName(app, userId) {
  try {
    const response = await app.client.users.info({ user: userId });
    return response.user.real_name || response.user.name; // Utilisez le nom complet ou, à défaut, le nom d'utilisateur
  } catch (error) {
    console.error(`Error while retrieving the name for user ${userId}:`, error);
    return `User_${userId}`; // Retourne une valeur par défaut en cas d'erreur
  }
}

async function getAllChannelActivity(app) {
  console.log(`In getAllChannelActivity(${app})`); 
  try {
    const result = await app.client.conversations.list({
      types: "public_channel,private_channel",
      limit: 10000,
    });
console.log(`In getAllChannelActivity(${app}) / result = ${result}`);
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
      await sleep(1/6); // fréquence du bot (en heure)
    }
  } catch (error) {
    console.error("Error while retrieving the channel list:", error);
  }
}

async function getChannelActivityForUser(app, userId, channels) {
  try {
    const now = Date.now();
    const reportDate = new Date();
    const formattedDate = reportDate.toLocaleDateString();
    const formattedTime = reportDate.toLocaleTimeString();

    const messageWithTimestamp = `${formattedDate} - ${formattedTime}`;

    // Récupérer le nom de l'utilisateur
    const userName = await getUserName(app, userId);
    const teamId = "T07C1G6AT1Q";

    // Groupes d'inactivité
    const groupedActivity = {
      "60+": { emoji: ":red_circle:", channels: [] },
      "30+": { emoji: ":large_orange_circle:", channels: [] },
      "15+": { emoji: ":large_yellow_circle:", channels: [] },
      "5+": { emoji: ":large_green_circle:", channels: [] },
    };
    

    for (const channel of channels) {
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
        } else {
          const creationDate = new Date(channel.created * 1000).getTime();
          daysSinceLastMessage = (now - creationDate) / (1000 * 60 * 60 * 24);
        }

        const channelLink = `<slack://channel?team=${teamId}&id=${channel.id}|#${channel.name}> - inactive for ${Math.round(daysSinceLastMessage)} days`;

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
        console.error(`Error while retrieving history from channel ${channel.name}:`, error);
      }
    }

    // Génération du message formaté
    let message = `Hi ${userName} ! Here is your Slack room activity report :wink: :

`;
    for (const [key, value] of Object.entries(groupedActivity)) {
      if (value.channels.length > 0) {
        message += `${value.emoji} Inactive for ${key} days\n\t ${value.channels.join("\n\t")}\n\n`;
      }
    }

    message += `Report generated on ${messageWithTimestamp}.`;

    // Envoi du message
    console.log(`Sending message to user ${userId}: ${message}`); // Log pour vérifier le contenu du message

    await sendPrivateMessage(app, userId, message);
    console.log(`Message sent to user ${userId} at ${messageWithTimestamp}`); // Log pour confirmer l'envoi

    console.log("\n------------------\n"); // Ligne de séparation dans les logs
  } catch (error) {
    console.error("Error while retrieving the channel list:", error);
  }
}

module.exports = { getAllChannelActivity, getChannelActivityForUser };
