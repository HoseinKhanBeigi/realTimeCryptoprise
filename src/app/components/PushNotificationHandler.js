"use client";

import { useEffect } from "react";

export default function PushNotificationHandler() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          // Register service worker
          const registration = await navigator.serviceWorker.register("/sw.js");

          // Get the VAPID public key from the API
          const response = await fetch("/api/subscribe");
          const { publicVapidKey } = await response.json();

          // Convert VAPID key to Uint8Array
          const convertedKey = urlBase64ToUint8Array(publicVapidKey);

          // Subscribe the user to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });

          // Send the subscription to the server
          await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription),
          });

          console.log("Subscription sent to the server.");
        } catch (error) {
          console.error(
            "Failed to register service worker or subscribe:",
            error
          );
        }
      } else {
        console.warn("Push notifications are not supported in this browser.");
      }
    };

    const urlBase64ToUint8Array = (base64String) => {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    registerServiceWorker();
  }, []);

  return null; // This component only handles the subscription logic
}
