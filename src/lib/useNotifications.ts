import { useState, useEffect } from 'react';
import { requestNotificationPermission, listenForMessages } from './firebase';
import api from './api';
import { useAuthCheck } from './auth';

export const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuthCheck();

  // Initialize Firebase messaging
  useEffect(() => {
    console.log('isAuthenticated', isAuthenticated);
    console.log('user', user);
    if (!isAuthenticated || !user) return;

    const initializeFirebase = async () => {
      try {
        const token = await requestNotificationPermission();
        console.log('FCM Token:', token);
        if (token) {
          setFcmToken(token);
          // Send token to backend
          await api.post('/notifications/register-token', { 
            fcmToken: token,
            userId: user.id,
            deviceInfo: navigator.userAgent 
          });
        }
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };

    initializeFirebase();
  }, [isAuthenticated, user]);

  // Listen for foreground messages
 // useNotifications.ts
useEffect(() => {
  console.log("🔔 Listening for FCM token...");
  if (!fcmToken) return;
  console.log("🔔 FCM token found:", fcmToken);
  const unsubscribe = listenForMessages((payload) => {
    console.log("📩 Message received in foreground:", payload);
    const notification = {
      id: Date.now().toString(),
      title: payload.notification?.title || "No title",
      message: payload.notification?.body || "No body",
      data: payload.data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/icon-192x192.png",
        data: payload.data,
      });
    }
  });

  return () => unsubscribe();
}, []);

  // Listen for notification clicks from service worker
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'NOTIFICATION_CLICK') {
        // Handle navigation or other actions
        window.location.href = event.data.url;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    fcmToken,
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount
  };
};