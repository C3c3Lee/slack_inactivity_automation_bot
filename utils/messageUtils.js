async function sendPrivateMessage(app, userId, message) {
  try {
    // Récupérer les informations de l'utilisateur pour le nom (optionnel)
    const userInfo = await app.client.users.info({ user: userId });
    const userName = userInfo.user.profile.display_name || userInfo.user.real_name || userInfo.user.name;

    // Ouvrir une conversation directe avec l'utilisateur
    const conversation = await app.client.conversations.open({
      users: userId
    });

    // Envoyer le message dans la conversation directe
    await app.client.chat.postMessage({
      channel: conversation.channel.id,
      text: message,
    });

    // Log détaillé avec le contenu et l'heure du message envoyé
    console.log(`Message sent to ${userName} (User ID : ${userId}) in ${conversation.channel.id}:\n${message}`);

  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
  }
}

module.exports = { sendPrivateMessage };
