"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/contexts/AuthContext";
import { trackAnalyticsEvent } from "@/shared/components/analytics/AnalyticsTracker";
import HeaderSearch from "@/features/header/components/HeaderSearch";
import NotificationsMenu from "@/features/header/components/NotificationsMenu";

export default function Header() {
  const t = useTranslations();
  const { isLoggedIn, user } = useAuth();
  const displayName = user?.username || t("common.greeting.companyname");

  return (
    <header className="w-full overflow-visible border-b border-border">
      <div className="header-inner overflow-visible">
        <div className="header-brand">{t("header.title")}</div>
        <HeaderSearch />
        {isLoggedIn ? (
          <NotificationsMenu displayName={displayName} enabled={isLoggedIn} />
        ) : (
          <div className="hidden items-center gap-3 font-inter text-xs text-text-tertiary lg:flex">
            <button
              type="button"
              className="btn-primary px-5 py-3"
              onClick={() => trackAnalyticsEvent("signup_started")}
              aria-label="Sign up for free"
            >
              {t("common.auth.signup")}
            </button>
            <button type="button" className="btn-login-outline" aria-label="Log in to your account">
              {t("common.auth.login")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
