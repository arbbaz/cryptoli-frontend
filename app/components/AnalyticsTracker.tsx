"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getAnalyticsConsent } from "./CookieConsent";
import { getApiBaseUrl } from "@/lib/env";

const SESSION_STORAGE_KEY = "analytics_session_id";
const UTM_STORAGE_KEY = "analytics_utm";

type FunnelEvent = "signup_started" | "signup_completed" | "purchase" | "like";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return randomId();
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing && /^[a-zA-Z0-9_-]{8,128}$/.test(existing)) return existing;
  const sessionId = randomId().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function getUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get("utm_source") ?? undefined;
  const utm_medium = params.get("utm_medium") ?? undefined;
  const utm_campaign = params.get("utm_campaign") ?? undefined;
  return { utm_source, utm_medium, utm_campaign };
}

function getPersistedUtm(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === "undefined") return {};
  const fromUrl = getUtmParams();
  if (fromUrl.utm_source || fromUrl.utm_medium || fromUrl.utm_campaign) {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as { utm_source?: string; utm_medium?: string; utm_campaign?: string };
  } catch {
    return {};
  }
}

function sendTrack(base: string, payload: Record<string, unknown>, preferBeacon = false): void {
  const body = JSON.stringify(payload);
  if (preferBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(`${base}/api/analytics/track`, new Blob([body], { type: "application/json" }));
    return;
  }
  fetch(`${base}/api/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Emit a funnel or engagement event to analytics.
 * - signup_started: user clicked signup (e.g. header button)
 * - signup_completed: user finished registration (emitted after successful register)
 * - purchase: emit when a purchase/checkout completes (e.g. trackAnalyticsEvent("purchase") in payment success)
 * - like: emit when user likes content (e.g. trackAnalyticsEvent("like") in like button handler)
 */
export function trackAnalyticsEvent(event: FunnelEvent, extras?: { path?: string }): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("analytics:funnel_event", { detail: { event, path: extras?.path } }),
  );
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const currentPathRef = useRef<string>("");
  const enteredAtRef = useRef<string>("");

  useEffect(() => {
    if (getAnalyticsConsent() !== true) return;
    const base = getApiBaseUrl();
    if (!base) return;

    if (!sessionIdRef.current) sessionIdRef.current = getOrCreateSessionId();
    const sessionId = sessionIdRef.current;
    const path = pathname || "/";
    const now = new Date().toISOString();

    const prevPath = currentPathRef.current;
    const prevEntered = enteredAtRef.current;
    if (prevPath && prevEntered && prevPath !== path) {
      sendTrack(base, {
        path: prevPath,
        device: typeof navigator !== "undefined" ? navigator.userAgent : "",
        event: "page_leave",
        sessionId,
        enteredAt: prevEntered,
        leftAt: now,
        consent: true,
      }, true);
    }

    const enteredAt = now;
    enteredAtRef.current = enteredAt;
    currentPathRef.current = path;
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const utm = getPersistedUtm();

    sendTrack(base, {
      path,
      device: typeof navigator !== "undefined" ? navigator.userAgent : "",
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
      event: "page_view",
      sessionId,
      enteredAt,
      referrer: referrer || undefined,
      consent: true,
      ...utm,
    });

    const sendLeave = (leftAt: string) => {
      const pathToLeave = currentPathRef.current;
      const entered = enteredAtRef.current;
      if (!pathToLeave || !entered) return;
      sendTrack(base, {
        path: pathToLeave,
        device: typeof navigator !== "undefined" ? navigator.userAgent : "",
        event: "page_leave",
        sessionId,
        enteredAt: entered,
        leftAt,
        consent: true,
      }, true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") sendLeave(new Date().toISOString());
    };
    const handlePageHide = () => sendLeave(new Date().toISOString());
    const handleFunnelEvent = (evt: Event) => {
      const detail = (evt as CustomEvent<{ event?: FunnelEvent; path?: string }>).detail;
      const funnelEvent = detail?.event;
      if (!funnelEvent) return;
      sendTrack(base, {
        path: detail.path || currentPathRef.current || path,
        device: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
        event: funnelEvent,
        sessionId,
        consent: true,
        ...getPersistedUtm(),
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("analytics:funnel_event", handleFunnelEvent);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("analytics:funnel_event", handleFunnelEvent);
    };
  }, [pathname]);

  return null;
}
