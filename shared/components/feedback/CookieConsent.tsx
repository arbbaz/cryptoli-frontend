"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const COOKIE_NAME = "analytics_consent_v2";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export function getAnalyticsConsent(): boolean | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function setAnalyticsConsent(accepted: boolean): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${accepted}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("analytics:consent_changed", { detail: { consent: accepted } })
    );
  }
}

interface CookieConsentProps {
  initialConsent?: boolean | null;
}

export default function CookieConsent({ initialConsent = null }: CookieConsentProps) {
  const t = useTranslations("cookieConsent");
  const [visible, setVisible] = useState(() => {
    const consent = initialConsent ?? getAnalyticsConsent();
    return consent === null;
  });

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setVisible(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-white p-4 shadow-lg sm:p-5"
      role="dialog"
      aria-label={t("title")}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-primary">
          {t("message")}{" "}
          <Link href="/privacy" className="text-primary underline hover:opacity-90">
            {t("privacyLink")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="btn-secondary rounded-md px-4 py-2 text-sm"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="btn-primary rounded-md px-4 py-2 text-sm"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
