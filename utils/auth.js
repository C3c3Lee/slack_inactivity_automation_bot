async function logBotPermissions(app) {
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

module.exports = { logBotPermissions };
