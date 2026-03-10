"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/contexts/AuthContext";
import { Link, useRouter } from "@/i18n/routing";
import Header from "@/app/components/Header";
import LeftSidebar from "@/app/components/LeftSidebar";
import RightSidebar from "@/app/components/RightSidebar";
import Footer from "@/app/components/Footer";
import { notificationsApi } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsClient() {
  const t = useTranslations();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      const res = await notificationsApi.list();
      if (!active) return;
      if (res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!socket || !isLoggedIn) return;

    const handleCreated = (payload: {
      notification: NotificationItem;
      unreadCount: number;
    }) => {
      setNotifications((prev) => [payload.notification, ...prev]);
      setUnreadCount(payload.unreadCount);
    };

    const handleRead = (payload: {
      notificationId: string;
      unreadCount: number;
    }) => {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === payload.notificationId ? { ...item, read: true } : item,
        ),
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
  }, [socket, isLoggedIn]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
    const res = await notificationsApi.markRead(id);
    if (res.data) setUnreadCount(res.data.unreadCount);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    await notificationsApi.markAllRead();
  };

  if (!isLoggedIn) {
    router.replace("/");
    return null;
  }

  return (
    <div className="bg-bg-white text-foreground">
      <Header />
      <div className="page-container">
        <div className="page-main-wrap">
          <main className="main-grid">
            <LeftSidebar />

            <section className="content-section mt-15">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-xl font-semibold text-text-dark">
                    {t("notifications.title", { defaultValue: "Notifications" })}
                  </h1>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {t("notifications.markAllRead", { defaultValue: "Mark all as read" })}
                    </button>
                  )}
                </div>

                {loading ? (
                  <p className="text-sm text-text-tertiary py-8 text-center">
                    {t("notifications.loading", { defaultValue: "Loading…" })}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-text-tertiary py-8 text-center">
                    {t("notifications.empty", { defaultValue: "No notifications yet" })}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {notifications.map((item) => (
                      <li key={item.id}>
                        <NotificationBlock
                          item={item}
                          onMarkRead={handleMarkRead}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <RightSidebar />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function NotificationBlock({
  item,
  onMarkRead,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
}) {
  const content = (
    <>
      <p className="text-sm font-semibold text-text-dark">{item.title}</p>
      <p className="text-xs text-text-secondary mt-0.5 line-clamp-3">{item.message}</p>
      <p className="text-[11px] text-text-tertiary mt-1">
        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
      </p>
    </>
  );

  const className = `w-full text-left rounded-lg px-3 py-2.5 border border-border transition-colors ${
    item.read ? "bg-bg-lightest" : "bg-primary-bg"
  }`;

  if (item.link) {
    return (
      <Link
        href={item.link}
        className={`block ${className}`}
        onClick={() => !item.read && onMarkRead(item.id)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !item.read && onMarkRead(item.id)}
      className={className}
    >
      {content}
    </button>
  );
}
