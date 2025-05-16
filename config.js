module.exports = {
  messageDelay: 1000, // Délai en millisecondes pour éviter les limites de taux
    SUPPORT_CHANNEL_ID : ["U07BYJYT7PX","U07BYKFC35K","U07CEDPQ2CR"],
    LOG_MESSAGES: {
        FUNCTION_START: "🚀 [START] getAllChannelActivity()",
        FETCH_LIST: "📡 Fetching list of all conversations...",
        RETRIEVE_LIST: (count) => `✅ Retrieved ${count} channels from Slack API.`,
        GROUP_CHECK: "🔍 Checking if room belongs to Support team...",
        GROUP_DENIED: "❌ Room skipped: Not part of Support team.",
        BOT_CHECK: "🔎 Checking if bot is in the room...",
        BOT_ADDED: "✅ Bot added to the room!",
        BOT_ALREADY_PRESENT: "✔️ Bot already in the room, continuing process...",
        MESSAGE_SENT: "📩 Report sent to user: ",
        ERROR_HISTORY: "⚠️ Error retrieving history for channel: ",
    }
};