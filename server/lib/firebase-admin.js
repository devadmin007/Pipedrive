const admin = require("firebase-admin");
const serviceAccount = require("./pipedrive-4fd1e-firebase-adminsdk-fbsvc-05d1a6ee94.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});



const sendNotification = async (token, title, body, data = {}) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    // Validate token(s)
    if (!token || (Array.isArray(token) && token.length === 0)) {
      throw new Error("Token is required and cannot be empty");
    }

    const tokens = Array.isArray(token) ? token : [token];

    // Build base payload
    const baseMessage = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };

    let response;
    let failed = [];

    if (tokens.length === 1) {
      // ✅ Single token -> use send()
      const message = { ...baseMessage, token: tokens[0] };
      console.log("🚀 Sending single notification:", message);
      response = await admin.messaging().send(message);
      console.log("✅ Single notification sent:", response);
      return { success: 1, failed: [] };

    } else {
      // ✅ Multiple tokens -> use sendEachForMulticast()
      const message = { ...baseMessage, tokens };
      console.log("🚀 Sending multicast notification:", message);
      response = await admin.messaging().sendEachForMulticast(message);

      failed = response.responses
        .map((res, i) => (!res.success ? tokens[i] : null))
        .filter(Boolean);

      console.log("✅ Multicast response:", response);
      return { success: response.successCount, failed };
    }
  } catch (err) {
    console.error("🔥 Error sending notification:", err);
    return { success: 0, failed: Array.isArray(token) ? token : [token] };
  }
};

module.exports = { sendNotification };
