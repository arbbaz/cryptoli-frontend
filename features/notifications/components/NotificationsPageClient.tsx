"use client";

import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Link, useRouter } from "@/i18n/routing";
import AppShell from "@/features/layout/components/AppShell";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPageClient() {
  const t = useTranslations();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(isLoggedIn, {
    strategy: "immediate",
  });

  if (!isLoggedIn) {
    router.replace("/");
    return null;
  }

  return (
    <AppShell contentClassName="content-section mt-15">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-text-dark">
            {t("notifications.title", { defaultValue: "Notifications" })}
          </h1>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t("notifications.markAllRead", { defaultValue: "Mark all as read" })}
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            {t("notifications.loading", { defaultValue: "Loading..." })}
          </p>
        ) : notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            {t("notifications.empty", { defaultValue: "No notifications yet" })}
          </p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((item) => (
              <li key={item.id}>
                <NotificationBlock item={item} onMarkRead={markRead} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function NotificationBlock({ item, onMarkRead }: { item: NotificationItem; onMarkRead: (id: string) => Promise<void> }) {
  const content = (
    <>
      <p className="text-sm font-semibold text-text-dark">{item.title}</p>
      <p className="mt-0.5 line-clamp-3 text-xs text-text-secondary">{item.message}</p>
      <p className="mt-1 text-[11px] text-text-tertiary">
        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
      </p>
    </>
  );

  const className = `w-full text-left rounded-lg px-3 py-2.5 border border-border transition-colors ${
    item.read ? "bg-bg-lightest" : "bg-primary-bg"
  }`;

  if (item.link) {
    return (
      <Link href={item.link} className={`block ${className}`} onClick={() => !item.read && onMarkRead(item.id)}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => !item.read && onMarkRead(item.id)} className={className}>
      {content}
    </button>
  );
}
