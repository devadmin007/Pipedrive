// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyCMidte6dOxRRdiLmO4HLLGG9u3MD0Q0ys",
  authDomain: "pipedrive-4fd1e.firebaseapp.com",
  projectId: "pipedrive-4fd1e",
  storageBucket: "pipedrive-4fd1e.appspot.com",
  messagingSenderId: "838589354881",
  appId: "1:838589354881:web:b628f5a610331302608e80"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ✅ Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background FCM message received:", payload);
  
  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || 'New Notification';
  const notificationOptions = {
    body: body || 'You have a new message',
    icon: icon || '/icon-192x192.png',
    badge: '/badge-72x72.png', // Optional: small icon in status bar
    tag: 'fcm-notification', // Prevents duplicate notifications
    requireInteraction: true, // Keep notification until user interacts
    data: payload.data || {} // Pass custom data
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close(); // Close the notification
  
  // Handle the click action
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus on it
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});