module.exports = {
  // Delay in milliseconds between messages to avoid Slack rate limits
  MESSAGE_DELAY: 1000,
  // Report interval in hours (modifiable for test/prod)
  REPORT_INTERVAL_HOURS: 24,//24 * 7, // default: 7 days
  //External log interval
  LOG_FILE_PATTERN: 'weekly', // 'weekly', 'monthly', or 'single'
    /**
   * Log file name pattern (use [datetime] as a placeholder for the timestamp).
   * Example: 'slack_inactivity_autobot_[datetime].log'
   * The [datetime] placeholder will be replaced by the current date and time (YYYYMMDD-HHmmss).
   */
  LOG_FILE_NAME_PATTERN: 'slack_inactivity_autobot_[datetime].log',
  //External log access
  LOG_FILE_READONLY: false,    // true = set log file to read-only after write
  // Directory where log files are stored.
  //LOGS_DIR: '/Users/c.longlade/Documents/Slack_inactivity_autobot_log',
  LOGS_DIR: './logs',
  
  TIMEZONE: "Europe/Paris",

  // List of user IDs whose created channels should be monitored (Support team)
  SUPPORT_USER_IDS: [
    "U0KAKFUNA", // Giovanni Berthelot
    "U01HR0K29DL", // Cynthia Djiab
    "U0406LMSRJ8", // Jawad Wagam
    "UF90NEPRD", // Laurent Melchi
    "U03N3NNKWA0", // Morgane Le Rouzic
    "UA3GEGA2E", // Purnadi Kertonugroho
    "U087754PR6E", // Tristan Berger
    "U02GC00G6SJ" // Célia Longlade (for test purpose)
  ],

  // Inactivity thresholds (in days) and associated emoji
  INACTIVITY_THRESHOLDS: [
    { days: 100, emoji: ":black_circle:" },
    { days: 60, emoji: ":red_circle:" },
    { days: 30, emoji: ":large_orange_circle:" },
    { days: 15, emoji: ":large_yellow_circle:" },
    { days: 5, emoji: ":large_green_circle:" }
  ],
    REPORT_MESSAGE_TEMPLATE: ({ userName, activityBlocks, date, time }) =>
    `Hi ${userName}! Here is your Slack room activity report:\n\n${activityBlocks}\nReport generated on ${date} - ${time}.`,
  ACTIVITY_BLOCK_TEMPLATE: ({ emoji, key, channels }) =>
    `${emoji} Inactive for ${key} days:\n\t${channels.join("\n\t")}\n\n`,

  // Log messages for consistent logging throughout the app
  LOG_MESSAGES: {
    FUNCTION_START: "🚀 [START] getAllChannelActivity()",
    FETCH_LIST: "📡 Fetching list of all conversations...",
    RETRIEVE_LIST: (count) => `✅ Retrieved ${count} channels from Slack API.`,
    GROUP_CHECK: (userName, userId) => `🔍 Checking if room belongs to Support team... (User: ${userName}, ID: ${userId})`,
    BOT_CHECK: (channelName, channelId) => `🔎 Checking if bot is in channel: ${channelName} (ID: ${channelId})`,
    BOT_ALREADY_PRESENT: (channelName) => `✔️ Bot already in channel: ${channelName}`,
    BOT_JOINED: (channelName, channelId) => `➕ Bot successfully joined channel: ${channelName} (ID: ${channelId})`,
    BOT_JOIN_FAILED: (channelName, channelId, error) => `❌ Bot could not join channel ${channelName} (ID: ${channelId}): ${error}`,
    SKIP_NON_SUPPORT: (channelName, channelId) => `⏭️ Skipping channel ${channelName} (ID: ${channelId}) - previously marked as non-support`,
    MARK_NON_SUPPORT: (channelName, channelId) => `🚫 Channel ${channelName} (ID: ${channelId}) is not created by a support member. Marked as non-support.`,
    GENERATE_REPORT: (userId) => `📊 Generating activity report for user: ${userId}`,
    END_PROCESS_USER: (userId) => `✅ [END] processUserChannels for user: ${userId}`,
    ERROR_PROCESS_USER: (userId, error) => `❌ Error in processUserChannels for user ${userId}: ${error}`,
    START_ACTIVITY_REPORT: (userId) => `📊 [START] Gathering activity report for user: ${userId}`,
    PREPARE_REPORT: (userName, userId) => `👤 Preparing report for: ${userName} (ID: ${userId})`,
    FETCH_HISTORY: (channelName, channelId) => `📡 Fetching history for channel: ${channelName} (ID: ${channelId})`,
    LAST_MESSAGE: (channelName, days) => `📅 Last message in ${channelName} was ${days} days ago`,
    NO_MESSAGE: (channelName, days) => `📅 No messages found in ${channelName}, channel created ${days} days ago`,
    END_ACTIVITY_REPORT: (userId) => `✅ [END] Activity report sent to ${userId}`,
    ERROR_ACTIVITY_REPORT: (userId, error) => `❌ Error in getChannelActivityForUser for user ${userId}: ${error}`,
    ERROR_HISTORY: (channelName, error) => `❌ Error retrieving history for channel ${channelName}: ${error}`,  MESSAGE_SENT: (userName, userId, channelId) =>
    `📨 Message sent to ${userName} (User ID: ${userId}) in ${channelId}`,
    ERROR_SEND_DM: (userId, error) =>
    `❌ Error sending message to user ${userId}: ${error}`,

  }
};