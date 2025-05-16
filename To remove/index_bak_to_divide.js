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

async function getAllChannelActivity() {
  try {
    const result = await app.client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 1000,
    });

    // Collecter les créateurs et leurs rooms
    const creatorRoomsMap = new Map();

    result.channels.forEach((channel) => {
      const creatorId = channel.creator;
      if (!creatorRoomsMap.has(creatorId)) {
        creatorRoomsMap.set(creatorId, []);
      }
      creatorRoomsMap.get(creatorId).push(channel);
    });

    // Générer et envoyer un rapport pour chaque créateur
    for (const [creatorId, channels] of creatorRoomsMap) {
      await getChannelActivityForUser(creatorId, channels);
      await sleep(1000); // éviter les limites de taux
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de la liste des channels:', error);
  }
}

// Fonction principale pour lister tous les utilisateurs et envoyer leur rapport d'activité
async function getAllUsersActivityReports() {
  try {
    const usersResult = await app.client.users.list();
    const users = usersResult.members;

    for (const user of users) {
      if (!user.is_bot && !user.deleted) {
        await getChannelActivityForUser(user.id);
        // Ajout d'un délai pour éviter d'atteindre la limite de taux
        await sleep(2000);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la liste des utilisateurs:", error);
  }
}

// Modifiez votre `getChannelActivityForUser` pour appeler `sendPrivateMessage` en vérifiant chaque ID de conversation ouvert
async function getChannelActivityForUser(userId) {
  try {
    const result = await app.client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 1000,
    });
    const channels = result.channels.filter(channel => channel.creator === userId);

    let userActivity = [];
    const now = Date.now();

    for (const channel of channels) {
      try {
        const channelInfo = await app.client.conversations.info({ channel: channel.id });
        const botInChannel = channelInfo.channel.is_member;

        if (!botInChannel) {
          await app.client.conversations.join({ channel: channel.id });
          console.log(`Le bot a été ajouté à la room #${channel.name}`);
        }

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

        userActivity.push(`#${channel.name} - ${daysSinceLastMessage > 5 ? `${Math.round(daysSinceLastMessage)} jours sans activité` : "à jour (moins de 5 jours d'inactivité)"}`);
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'historique pour le channel ${channel.name}:`, error);
      }
    }

    if (userActivity.length > 0) {
      const userInfo = await app.client.users.info({ user: userId });
      const userName = userInfo.user.real_name || userInfo.user.name;
      const message = `Rapport d'Activité de ${userName} :\n${userActivity.join("\n")}`;
      await sendPrivateMessage(userId, message);
      console.log(`Message envoyé à l'utilisateur ${userId} : ${message}`);
    } else {
      console.log(`Pas de channels inactifs pour l'utilisateur ${userId}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste des channels:', error);
  }
}

// Appel de la fonction pour tous les utilisateurs
//getAllUsersActivityReports();


// Fonction d'envoi de message privé
async function sendPrivateMessage(userId, message) {
  try {
    const userInfo = await app.client.users.info({ user: userId });
    const userName = userInfo.user.profile.display_name || userInfo.user.real_name || userInfo.user.name;

    const conversation = await app.client.conversations.open({
      users: userId
    });

    await app.client.chat.postMessage({
      channel: conversation.channel.id,
      text: message,
    });

    console.log(`Message envoyé à ${userName} (ID utilisateur : ${userId})`);

  } catch (error) {
    console.error(`Erreur lors de l'envoi du message à l'utilisateur ${userId}:`, error);
  }
}


// Exemple d'utilisation
//sendPrivateMessage('U07BYKFC35K', 'Ceci est un message privé pour tester l’envoi.');

// Exemple d'utilisation
//const userId = 'U07BYKFC35K'; // Remplace par l'ID du créateur
//getChannelActivityForUser();

// Exécution de la collecte de l'activité de tous les créateurs
//getAllChannelActivity();

//-----------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------

async function sendTestMessage(userId, message) {
  try {
    // Ouvrir une conversation directe avec l'utilisateur
    const conversation = await app.client.conversations.open({
      users: userId
    });

    console.log(`Conversation ouverte avec ID: ${conversation.channel.id}`);

    // Envoyer le message dans la conversation directe
    await app.client.chat.postMessage({
      channel: conversation.channel.id,
      text: message
    });

    console.log(`1. Message envoyé dans la conversation directe avec ID: ${conversation.channel.id}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message à l'utilisateur ${userId}:`, error);
  }
}


//sendTestMessage('U07BYKFC35K', 'Ceci est un message privé pour tester l’envoi.');



//-----------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);

async function sendMessageToUser(userId, message) {
  try {
    // Forcer l'ouverture d'une nouvelle conversation directe
    const res = await web.conversations.open({
      users: userId,
      return_im: true,
    });

    const channelId = res.channel.id; // ID de conversation directe

    await web.chat.postMessage({
      channel: channelId,
      text: message,
    });
    console.log(`Message envoyé directement à ${userId} dans le canal ${channelId}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message à ${userId}:`, error);
  }
}



// Exemple d'utilisation
//sendMessageToUser('U07BYKFC35K', 'hello'); // Remplacez 'USER_ID' par l'ID Slack de l'utilisateur


async function listUsersAndChannels() {
  try {
    // Lister tous les utilisateurs
    const usersRes = await web.users.list();
    console.log("Liste des utilisateurs et de leurs canaux directs:");

    // Boucler à travers chaque utilisateur, en excluant les bots
    for (const user of usersRes.members) {
      if (!user.is_bot && user.id !== 'USLACKBOT') { // Exclure les bots et le système Slackbot
        try {
          // Ouvrir un canal de discussion directe avec l'utilisateur
          const res = await web.conversations.open({
            users: user.id
          });

          // Utiliser l'ID de canal direct pour obtenir le channelId
          const channelId = res.channel.id;
          
          // Vérifier le type d'utilisateur
          const userRole = user.is_admin ? 'Admin' : user.is_owner ? 'Owner' : 'Member';
          console.log(`Nom : ${user.name}, ID : ${user.id}, channelId : ${channelId}, Rôle : ${userRole}`);
          
        } catch (error) {
          console.error(`Erreur lors de l'ouverture d'une conversation avec ${user.name} :`, error);
        }
      }
    }

    // Lister tous les canaux publics
    const channelsRes = await web.conversations.list({
      types: 'public_channel, private_channel' // Pour obtenir également les canaux privés
    });
    console.log("\nListe des canaux:");
    channelsRes.channels.forEach(channel => {
      console.log(`Nom : ${channel.name}, ID : ${channel.id}`);
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs ou des canaux:", error);
  }
}

// Appeler la fonction pour lister les utilisateurs et les canaux
//listUsersAndChannels();