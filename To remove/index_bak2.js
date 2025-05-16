const { App, LogLevel } = require("@slack/bolt");
require("dotenv").config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
});

// Gestionnaire de limite de taux
function sleep(ms) {
  console.log(`Function: sleep(${ms})`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fonction pour afficher les scopes disponibles (permissions)
async function logBotPermissions() {
  console.log("2. Function: logBotPermissions()");
  try {
    const authResult = await app.client.auth.test();
    console.log(
      "Bot Permissions (scopes):",
      authResult.response_metadata.scopes
    );
  } catch (error) {
    console.error("Error retrieving bot permissions:", error);
  }
}

// Fonction pour obtenir les utilisateurs
async function getUsers() {
  try {
    console.log("3. Function: getUsers()");
    const result = await app.client.users.list();
    return result.members.filter(
      (member) => !member.is_bot && member.id !== "USLACKBOT"
    );
  } catch (error) {
    console.error("Error retrieving user list:", error);
    return [];
  }
}

// Fonction pour récupérer les informations de l'utilisateur à partir de son ID
async function getUserName(userId) {
  console.log(`5. Function: getUserName(${userId})`);
  try {
    const result = await app.client.users.info({
      user: userId,
    });
    return result.user.real_name || result.user.name;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération du nom d'utilisateur pour ${userId}:`,
      error
    );
    return "Unknown User"; // Valeur par défaut si on ne peut pas récupérer le nom
  }
}

// Fonction pour obtenir les canaux d'un utilisateur
async function getUserChannels(userId) {
  console.log(`4. Function: getUserChannels(${userId})`);
  try {
    const result = await app.client.conversations.list({
      types: "public_channel,private_channel",
      user: userId,
    });

    const channels = result.channels;

    for (const channel of channels) {
      // Tenter de rejoindre le canal si le bot n'y est pas déjà
      await app.client.conversations.join({ channel: channel.id });
      // Affichage du nom du canal et de son propriétaire dans les logs
      console.log(
        `User ID: ${userId} is part of channel: #${channel.name} (ID: ${channel.id})`
      );
    }

    return channels;
  } catch (error) {
    console.error(`Error retrieving channels for user ${userId}:`, error);
    return [];
  }
}

// Fonction pour obtenir l'activité des canaux
async function getChannelActivity() {
  console.log(`6. Function: getChannelActivity()`);
  try {
    const result = await app.client.conversations.list({
      types: "public_channel,private_channel",
      limit: 1000,
    });
    const channels = result.channels;
    const now = Date.now();
    const categorizedChannels = {
      inactive_5_days: [],
      inactive_15_days: [],
      inactive_30_days: [],
      inactive_60_days: [],
    };

    for (const channel of channels) {
      try {
        const history = await app.client.conversations.history({
          channel: channel.id,
          limit: 100, // Récupérez plusieurs messages pour filtrer
        });

        // Filtrer les messages automatiques
        const filteredMessages = history.messages.filter((message) => {
          return !message.subtype || message.subtype !== "channel_join"; // Exclure les messages d'adhésion au canal
        });

        if (filteredMessages.length > 0) {
          const lastMessageTime = new Date(
            parseFloat(filteredMessages[0].ts) * 1000
          ).getTime();
          const daysSinceLastMessage =
            (now - lastMessageTime) / (1000 * 60 * 60 * 24);

          if (daysSinceLastMessage > 60) {
            categorizedChannels.inactive_60_days.push(
              `#${channel.name} - ${Math.round(
                daysSinceLastMessage
              )} days without activity`
            );
          } else if (daysSinceLastMessage > 30) {
            categorizedChannels.inactive_30_days.push(
              `#${channel.name} - ${Math.round(
                daysSinceLastMessage
              )} days without activity`
            );
          } else if (daysSinceLastMessage > 15) {
            categorizedChannels.inactive_15_days.push(
              `#${channel.name} - ${Math.round(
                daysSinceLastMessage
              )} days without activity`
            );
          } else if (daysSinceLastMessage > 5) {
            categorizedChannels.inactive_5_days.push(
              `#${channel.name} - ${Math.round(
                daysSinceLastMessage
              )} days without activity`
            );
          } else if (daysSinceLastMessage > 1 / 48) {
            categorizedChannels.inactive_5_days.push(
              `#${channel.name} - ${Math.round(
                daysSinceLastMessage
              )} days without activity`
            );
          } else {
            console.log(`No significant inactivity in channel ${channel.name}`);
          }
        } else {
          // Si aucun message trouvé, le canal est considéré comme inactif
          categorizedChannels.inactive_60_days.push(
            `#${channel.name} - No messages`
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de la récupération de l'historique pour le canal ${channel.id}:`,
          error
        );
      }
    }

    return categorizedChannels;
  } catch (error) {
    console.error("Error retrieving channels list:", error);
    return {};
  }
}

// Fonction pour envoyer un message privé à un utilisateur
async function sendPrivateMessage(channelName, userId, userName, message) {
  console.log(
    `7. Function: sendPrivateMessage(channelName "${channelName}", userId ${userId}, userName ${userName}, message)`
  );
  try {
    await app.client.chat.postMessage({
      channel: userId,
      text: message,
    });
  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
  }
}

// Fonction principale pour envoyer le rapport d'activité
async function sendChannelActivityReport() {
  console.log("1. Function: sendChannelActivityReport()");
  try {
    // Log des permissions du bot
    await logBotPermissions();
    const users = await getUsers();

    for (const user of users) {
      await sleep(1000); // Pause pour limiter les appels API
      const userChannels = await getUserChannels(user.id);
      let userActivity = []; // Contient les canaux inactifs

      for (const channel of userChannels) {
        const creatorName = await getUserName(channel.creator);
        console.log(`creatorName ${creatorName}`);
        try {
          // Récupérer l'historique du canal
          const history = await app.client.conversations.history({
            channel: channel.id,
            limit: 100,
          });

          // Filtrer les messages automatiques
          const filteredMessages = history.messages.filter((message) => {
            return !message.subtype || message.subtype !== "channel_join";
          });

          // Vérifier s'il y a des messages et calculer l'inactivité
          if (filteredMessages.length > 0) {
            const lastMessageTime = new Date(
              parseFloat(filteredMessages[0].ts) * 1000
            ).getTime();
            const daysSinceLastMessage = Math.floor(
              (Date.now() - lastMessageTime) / (1000 * 60 * 60 * 24)
            );

            let inactivityLevel = null;
            if (daysSinceLastMessage > 60) {
              inactivityLevel = "inactive_60_days";
            } else if (daysSinceLastMessage > 30) {
              inactivityLevel = "inactive_30_days";
            } else if (daysSinceLastMessage > 15) {
              inactivityLevel = "inactive_15_days";
            } else if (daysSinceLastMessage > 5) {
              inactivityLevel = "inactive_5_days";
            }

            // Si le canal est inactif, ajouter à la liste d'activité
            if (inactivityLevel) {
              userActivity.push(
                `\t:house: #${
                  channel.name
                } - :bust_in_silhouette: #${creatorName} - *${Math.round(
                  daysSinceLastMessage
                )}* days without activity`
              );
              console.log(
                `Channel ${channel.name} is inactive for ${Math.round(
                  daysSinceLastMessage
                )} days.`
              );
            } else {
              console.log(`Channel ${channel.name} has recent messages.`);
            }
          } else {
            console.log(`No messages found in #${channel.name}.`);
          }
        } catch (error) {
          console.error(
            `Error retrieving history for channel ${channel.id}:`,
            error
          );
        }
        // Log et envoyer le message si l'activité est trouvée
        if (userActivity.length > 0) {
          const message = `Channel Activity Report:\n${userActivity.join(
            "\n"
          )}`;

          await sendPrivateMessage(channel.name, user.id, user.name, message);
        } else {
          console.log(`No activity to report for user ${user.id}`);
        }
      }
    }
  } catch (error) {
    console.error("Error sending channel activity report:", error);
  }
}

// Exécution du rapport d'activité
//sendChannelActivityReport();
