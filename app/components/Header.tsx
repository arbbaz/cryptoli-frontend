"use client";

import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/contexts/AuthContext";
import { trackAnalyticsEvent } from "@/app/components/AnalyticsTracker";
import { notificationsApi, searchApi } from "@/lib/api";
import { refreshSocketConnection, useSocket } from "@/lib/socket";
import { usePushSubscription } from "@/lib/hooks/usePushSubscription";
import type { NotificationItem } from "@/lib/types";
import type { Review } from "@/lib/types";
import type { UserProfile } from "@/lib/types";

export default function Header() {
  const t = useTranslations();
  const { isLoggedIn, user } = useAuth();
  const { socket } = useSocket();
  const { status: pushStatus, register: registerPush, isRegistering: isPushRegistering } = usePushSubscription(!!isLoggedIn);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ reviews: Review[]; users: UserProfile[] }>({ reviews: [], users: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshSocketConnection();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      const response = await notificationsApi.list();
      if (!active) return;
      if (response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
      setIsLoadingNotifications(false);
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleCreated = (payload: {
      notification: NotificationItem;
      unreadCount: number;
    }) => {
      setNotifications((prev) => [payload.notification, ...prev].slice(0, 25));
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
  }, [socket, user?.id]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) {
      setSearchResults({ reviews: [], users: [] });
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchOpen(true);
    try {
      const res = await searchApi.search({ q: term, type: "all", limit: 10 });
      if (res.data?.results) {
        const r = res.data.results;
        setSearchResults({
          reviews: r.reviews ?? [],
          users: r.users ?? [],
        });
      } else {
        setSearchResults({ reviews: [], users: [] });
      }
    } catch {
      setSearchResults({ reviews: [], users: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults({ reviews: [], users: [] });
      setSearchOpen(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      runSearch(searchQuery);
      searchDebounceRef.current = null;
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, runSearch]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  const handleMarkRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );

    const response = await notificationsApi.markRead(notificationId);
    if (response.data) {
      setUnreadCount(response.data.unreadCount);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    await notificationsApi.markAllRead();
  };

  const displayName = user?.name?.trim() || user?.username || t("common.greeting.companyname");

  return (
    <header className="w-full border-b border-border overflow-visible">
      <div className="header-inner overflow-visible">
        <div className="header-brand">{t("header.title")}</div>
        <div className="flex-1 flex justify-center w-full sm:w-auto font-space-grotesk relative" ref={searchRef}>
          <input
            type="text"
            placeholder={t("common.search.placeholder")}
            className="header-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            aria-expanded={searchOpen}
            aria-autocomplete="list"
            aria-controls="header-search-results"
            id="header-search-input"
          />
          {searchOpen && (
            <div
              id="header-search-results"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 z-[100] max-h-[320px] overflow-y-auto rounded-lg border border-border bg-bg-white shadow-lg py-1"
            >
              {searchLoading ? (
                <p className="text-sm text-text-tertiary py-4 text-center">{t("common.search.loading", { defaultValue: "Searching…" })}</p>
              ) : (
                <>
                  {searchResults.users.length > 0 && (
                    <div className="px-2 py-1">
                      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">{t("common.search.users", { defaultValue: "Users" })}</p>
                      <ul className="mt-0.5">
                        {searchResults.users.map((u) => (
                          <li key={u.id}>
                            <Link
                              href={`/${u.username}`}
                              className="block px-2 py-2 rounded-md text-sm text-text-dark hover:bg-bg-lightest"
                              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                            >
                              <span className="font-medium">{u.username}</span>
                              {u.name && <span className="text-text-secondary ml-1">({u.name})</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {searchResults.reviews.length > 0 && (
                    <div className="px-2 py-1">
                      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">{t("common.search.reviews", { defaultValue: "Reviews" })}</p>
                      <ul className="mt-0.5">
                        {searchResults.reviews.map((rev) => (
                          <li key={rev.id}>
                            <Link
                              href={`/?q=${encodeURIComponent(searchQuery.trim())}`}
                              className="block px-2 py-2 rounded-md text-sm text-text-dark hover:bg-bg-lightest line-clamp-2"
                              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                            >
                              {rev.title}
                              {rev.company?.name && (
                                <span className="text-text-secondary text-xs ml-1">· {rev.company.name}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!searchLoading && searchQuery.trim() && searchResults.reviews.length === 0 && searchResults.users.length === 0 && (
                    <p className="text-sm text-text-tertiary py-4 text-center">{t("common.search.noResults", { defaultValue: "No results" })}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {isLoggedIn ? (
          <div ref={dropdownRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((o) => !o)}
              className="flex items-center gap-3 text-xs text-[#111111] font-inter cursor-pointer hover:opacity-80 transition-opacity outline-none"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Notifications"
            >
              <span>
                {t("common.greeting.hi")}, <span className="font-bold text-text-dark">{displayName}</span>
              </span>
              <span className="text-[11px] font-semibold rotate-90">&gt;</span>
              <span className="relative overflow-visible inline-flex flex-shrink-0">
                <span className="avatar w-9 h-9 z-10" />
                {unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white bg-primary absolute -top-1 -right-1 z-20">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </button>
            {isDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-[100] w-[320px] max-h-[400px] flex flex-col rounded-lg border border-border bg-bg-white shadow-lg overflow-hidden"
                role="menu"
              >
                <div className="px-3 py-2 border-b border-border flex-shrink-0">
                  <p className="text-sm font-semibold text-text-dark">{displayName}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} unread` : "Notifications"}
                  </p>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0 p-2">
                  {isLoadingNotifications ? (
                    <p className="text-sm text-text-tertiary py-6 text-center">Loading…</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-text-tertiary py-6 text-center">No notifications yet</p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => !item.read && handleMarkRead(item.id)}
                        className={`w-full text-left rounded-lg px-3 py-2.5 border border-border transition-colors ${
                          item.read ? "bg-bg-lightest" : "bg-primary-bg"
                        }`}
                      >
                        <p className="text-sm font-semibold text-text-dark">{item.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{item.message}</p>
                        <p className="text-[11px] text-text-tertiary mt-1">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-3 py-2 border-t border-border flex-shrink-0 space-y-1">
                  <Link
                    href="/notifications"
                    className="text-xs font-semibold text-primary hover:underline block"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    View all
                  </Link>
                  {(pushStatus === "prompt" || pushStatus === "error") && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-text-tertiary hover:text-primary disabled:opacity-50"
                      onClick={() => void registerPush()}
                      disabled={isPushRegistering}
                    >
                      {isPushRegistering ? "Enabling…" : "Enable browser notifications"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden items-center gap-3 text-xs text-text-tertiary lg:flex font-inter">
            <button
              type="button"
              className="px-5 py-3 btn-primary"
              onClick={() => trackAnalyticsEvent("signup_started")}
            >
              {t("common.auth.signup")}
            </button>
            <button type="button" className="btn-login-outline">{t("common.auth.login")}</button>
          </div>
        )}
      </div>
    </header>
  );
}
