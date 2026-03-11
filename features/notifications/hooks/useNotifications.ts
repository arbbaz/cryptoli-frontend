"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationsApi } from "@/features/notifications/api/client";
import { refreshSocketConnection, useSocket } from "@/lib/socket";
import type { NotificationItem } from "@/lib/types";

interface NotificationEventPayload {
  notification: NotificationItem;
  unreadCount: number;
}

interface NotificationReadPayload {
  notificationId: string;
  unreadCount: number;
}

interface UseNotificationsOptions {
  maxItems?: number;
  strategy?: "immediate" | "idle";
}

export function useNotifications(enabled: boolean, options?: UseNotificationsOptions) {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const maxItems = options?.maxItems;
  const strategy = options?.strategy ?? "immediate";

  const trimItems = useCallback(
    (items: NotificationItem[]) => (typeof maxItems === "number" ? items.slice(0, maxItems) : items),
    [maxItems],
  );

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let timerId: number | ReturnType<typeof setTimeout> | null = null;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const loadNotifications = async () => {
      setLoading(true);
      refreshSocketConnection();
      const response = await notificationsApi.list();
      if (!active) return;
      if (response.data) {
        setNotifications(trimItems(response.data.notifications));
        setUnreadCount(response.data.unreadCount);
      }
      setLoading(false);
    };

    if (strategy === "idle" && typeof idleWindow.requestIdleCallback === "function") {
      timerId = idleWindow.requestIdleCallback(() => {
        void loadNotifications();
      }, { timeout: 1500 });
    } else if (strategy === "idle") {
      timerId = globalThis.setTimeout(() => {
        void loadNotifications();
      }, 500);
    } else {
      void loadNotifications();
    }

    return () => {
      active = false;
      if (timerId != null) {
        if (typeof timerId === "number" && typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(timerId);
        } else {
          globalThis.clearTimeout(timerId);
        }
      }
    };
  }, [enabled, strategy, trimItems]);

  useEffect(() => {
    if (!enabled || !socket) return;

    const handleCreated = (payload: NotificationEventPayload) => {
      setNotifications((prev) => trimItems([payload.notification, ...prev]));
      setUnreadCount(payload.unreadCount);
    };

    const handleRead = (payload: NotificationReadPayload) => {
      setNotifications((prev) =>
        prev.map((item) => (item.id === payload.notificationId ? { ...item, read: true } : item)),
      );
      setUnreadCount(payload.unreadCount);
    };

    const handleAllRead = (payload: { unreadCount: number }) => {
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(payload.unreadCount);
    };

    socket.on("notification:created", handleCreated);
    socket.on("notification:read", handleRead);
    socket.on("notification:all-read", handleAllRead);

    return () => {
      socket.off("notification:created", handleCreated);
      socket.off("notification:read", handleRead);
      socket.off("notification:all-read", handleAllRead);
    };
  }, [enabled, socket, trimItems]);

  const markRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );

    const response = await notificationsApi.markRead(notificationId);
    if (response.data) {
      setUnreadCount(response.data.unreadCount);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    await notificationsApi.markAllRead();
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  };
}
