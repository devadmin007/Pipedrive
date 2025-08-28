const admin = require("firebase-admin");
const serviceAccount = require("/Users/rajhans/Downloads/pipedrive-4fd1e-firebase-adminsdk-fbsvc-05d1a6ee94.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const sendNotification = async (token, title, body, data = {}) => {
  try {
    const message = {
  token, // or token: singleToken
  notification: {
    title: title,
    body: body,
  },
  data: {
    ...data,
    click_action: "FLUTTER_NOTIFICATION_CLICK", // important for some browsers
  },
};
await admin.messaging().send({
  token: "<one FCM token>",
  notification: {
    title: "🚀 Test Notification",
    body: "This should appear in foreground",
  },
  data: {
    url: "/leads/test",
  }
});
    console.log("✅ Notification sent:", message);
    const failed = response.responses
      .map((res, i) => (!res.success ? token : null))
      .filter(Boolean);

    return { success: response.successCount, failed };
  } catch (err) {
    console.error("🔥 Error sending notification:", err);
    return { success: 0, failed: token };
  }
};

module.exports = { sendNotification };
