"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationsApi } from "@/features/notifications/api/client";

const SW_PATH = "/sw.js";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription(enabled: boolean) {
  const [status, setStatus] = useState<"unsupported" | "prompt" | "granted" | "denied" | "registered" | "error">("unsupported");
  const [isRegistering, setIsRegistering] = useState(false);

  const register = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey?.trim()) {
      setStatus("error");
      return;
    }

    setIsRegistering(true);
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
      await reg.update();

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("denied");
          setIsRegistering(false);
          return;
        }
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      const res = await notificationsApi.registerPushSubscription(subscription);
      if (res.error || !res.data?.success) {
        setStatus("error");
      } else {
        setStatus("registered");
      }
    } catch {
      setStatus("error");
    } finally {
      setIsRegistering(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    if (!Notification.permission) {
      setStatus("prompt");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    if (Notification.permission === "granted") {
      void register();
    }
  }, [enabled, register]);

  return { status, register, isRegistering };
}
