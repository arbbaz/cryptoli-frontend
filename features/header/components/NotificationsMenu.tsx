"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { usePushSubscription } from "@/features/notifications/hooks/usePushSubscription";

interface NotificationsMenuProps {
  displayName: string;
  enabled: boolean;
}

export default function NotificationsMenu({ displayName, enabled }: NotificationsMenuProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const { status: pushStatus, register, isRegistering } = usePushSubscription(enabled && isOpen);
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(enabled, {
    maxItems: 25,
    strategy: "idle",
  });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!enabled) return null;

  return (
    <div ref={dropdownRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex cursor-pointer items-center gap-3 text-xs font-inter text-[#111111] outline-none transition-opacity hover:opacity-80"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <span>
          {t("common.greeting.hi")}, <span className="font-bold text-text-dark">{displayName}</span>
        </span>
        <span className="rotate-90 text-[11px] font-semibold">&gt;</span>
        <span className="relative inline-flex flex-shrink-0 overflow-visible">
          <span className="avatar z-10 h-9 w-9" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-full z-[100] mt-1 flex max-h-[400px] w-[320px] flex-col overflow-hidden rounded-lg border border-border bg-bg-white shadow-lg"
          role="menu"
        >
          <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-border px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-text-dark">{displayName}</p>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {unreadCount > 0
                  ? `${unreadCount} ${t("notifications.unread", { defaultValue: "unread" })}`
                  : t("notifications.title", { defaultValue: "Notifications" })}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("notifications.markAllRead", { defaultValue: "Mark all as read" })}
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="py-6 text-center text-sm text-text-tertiary">
                {t("notifications.loading", { defaultValue: "Loading..." })}
              </p>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-tertiary">
                {t("notifications.empty", { defaultValue: "No notifications yet" })}
              </p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.read && void markRead(item.id)}
                  className={`w-full rounded-lg border border-border px-3 py-2.5 text-left transition-colors ${
                    item.read ? "bg-bg-lightest" : "bg-primary-bg"
                  }`}
                >
                  <p className="text-sm font-semibold text-text-dark">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{item.message}</p>
                  <p className="mt-1 text-[11px] text-text-tertiary">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="space-y-1 border-t border-border px-3 py-2">
            <Link
              href="/notifications"
              className="block text-xs font-semibold text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              {t("notifications.viewAll", { defaultValue: "View all" })}
            </Link>
            {(pushStatus === "prompt" || pushStatus === "error") && (
              <button
                type="button"
                className="text-xs font-semibold text-text-tertiary hover:text-primary disabled:opacity-50"
                onClick={() => void register()}
                disabled={isRegistering}
              >
                {isRegistering
                  ? t("notifications.enabling", { defaultValue: "Enabling..." })
                  : t("notifications.enableBrowser", { defaultValue: "Enable browser notifications" })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
