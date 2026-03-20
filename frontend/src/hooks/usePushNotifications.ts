import { useState, useEffect } from "react";
import { api } from "../lib/api";

const VAPID_PUBLIC_KEY = "BH5Amln1WrQH5DPxn9ES5lt6e95f5PUcFRBfRLUt-WULbJOxckgrpFq9Nyv9IKsDZs56zVbljf5GwWTAMVf4dNw";

// Utility to convert Base64 URL safe VAPID key to Uint8Array
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("Failed to check subscription status", err);
    }
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);
      if (permResult !== "granted") {
        throw new Error("Permission not granted for Notification");
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        // Already subscribed locally, ensure backend has it
        await api.post("/notifications/subscribe", existingSub.toJSON());
        setIsSubscribed(true);
        setLoading(false);
        return true;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await api.post("/notifications/subscribe", subscription.toJSON());
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error("Subscription failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Send unsubscribe request to backend first
        await api.delete("/notifications/unsubscribe", { 
          body: JSON.stringify({ endpoint: subscription.endpoint }) 
        });
        
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
      return true;
    } catch (error) {
      console.error("Unsubscribe failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe };
}
