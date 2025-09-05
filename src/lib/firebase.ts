import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCMidte6dOxRRdiLmO4HLLGG9u3MD0Q0ys",
  authDomain: "pipedrive-4fd1e.firebaseapp.com",
  projectId: "pipedrive-4fd1e",
  storageBucket: "pipedrive-4fd1e.appspot.com",
  messagingSenderId: "838589354881",
  appId: "1:838589354881:web:b628f5a610331302608e80",
  measurementId: "G-JBDWLEP9VC",
};

const app = initializeApp(firebaseConfig);

// ✅ Export messaging instance
export const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    console.log("🔍 Current permission:", Notification.permission);

    if (Notification.permission === "denied") {
      console.warn("🚫 Notifications are blocked by the user. Must be enabled in site settings.");
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log("📌 User responded with:", permission);

    if (permission === "granted") {
      const swRegistration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: 'BLIxhVtQQL9RiWjkuiiOKc19VFSEPqJ6-2Dv1sdoonsGUaJc1PL1DB7_knaE_AsdiNz_33T6LqZFAVjFRna-Zn8',
        serviceWorkerRegistration: swRegistration,
      });
    
      console.log("✅ FCM Token:", token);
    
      // Save token to backend
      await fetch("http://localhost:5000/api/users/fcm-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth-storage"))?.state?.token}` // your auth token
        },
        body: JSON.stringify({ token, deviceInfo: navigator.userAgent }),
      });
    
      return token;
    }
     else {
      console.warn("⚠️ User did not grant permission:", permission);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting notification permission:", error);
    return null;
  }
};


export const listenForMessages = (callback: (payload: any) => void) => {
  console.log("🔔 Listening for FCM messages...");
  return onMessage(messaging, (payload) => {
    console.log("📩 Foreground FCM message:", payload);
    callback(payload);

    // ❌ Remove serviceWorker.showNotification here
    // Let your React app handle it (toast, in-app notification, etc.)
  });
};

