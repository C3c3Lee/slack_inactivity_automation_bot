// Importation des fonctions depuis les modules utilitaires
const { logBotPermissions } = require("./utils/auth");
const { getAllChannelActivity, getChannelActivityForUser } = require("./utils/channelUtils");
const { sendPrivateMessage } = require("./utils/messageUtils");
const { sleep } = require("./utils/rateLimiter");

// Exemple d'utilisation des fonctions

async function runExample(app) {
  console.log("== Exécution des exemples ==");

  // 1. Vérifier les permissions du bot
  await logBotPermissions(app);

  // 2. Obtenir l'activité de tous les channels
  await getAllChannelActivity(app);

  // 3. Envoyer un message privé à un utilisateur donné
  const exampleUserId = "U12345678"; // Remplacer par un ID utilisateur Slack pour test
  await sendPrivateMessage(app, exampleUserId, "Ceci est un message de test.");

  // 4. Exemple de délai entre deux actions
  await sleep(2000); // Pause de 2 secondes pour démonstration

  // 5. Récupérer l'activité pour un utilisateur spécifique sur certains channels
  const exampleChannels = [
    { id: "C12345678", name: "general" },
    { id: "C23456789", name: "random" },
  ];
  await getChannelActivityForUser(app, exampleUserId, exampleChannels);
  
  console.log("== Fin des exemples ==");
}

module.exports = { runExample };
