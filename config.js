module.exports = {
  // Delay in milliseconds between messages to avoid Slack rate limits
  messageDelay: 1000,

  // List of user IDs whose created channels should be monitored (Support team)
  SUPPORT_USER_IDS: [
    // "U0KAKFUNA", // Giovanni Berthelot
    // "U01HR0K29DL", // Cynthia Djiab
    // "U0406LMSRJ8", // Jawad Wagam
    // "UF90NEPRD", // Laurent Melchi
    // "U03N3NNKWA0", // Morgane Le Rouzic
    // "UA3GEGA2E", // Purnadi Kertonugroho
    // "U087754PR6E", // Tristan Berger
    "U02GC00G6SJ" // Célia Longlade (for test purpose)
  ],

  // Team ID (Slack workspace)
  TEAM_ID: "T02SZ2K83",

  // Inactivity thresholds (in days) and associated emoji
  INACTIVITY_THRESHOLDS: [
    { days: 60, emoji: ":red_circle:" },
    { days: 30, emoji: ":large_orange_circle:" },
    { days: 15, emoji: ":large_yellow_circle:" },
    { days: 5, emoji: ":large_green_circle:" }
  ],

  // Log messages for consistent logging throughout the app
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