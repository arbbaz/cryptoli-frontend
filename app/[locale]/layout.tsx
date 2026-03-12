import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';
import Providers from '@/app/providers';
import AnalyticsTracker from '@/shared/components/analytics/AnalyticsTracker';
import CookieConsent from '@/shared/components/feedback/CookieConsent';
import { getServerAuth } from '@/lib/server-api';
import { hasLikelyAuthCookie } from '@/lib/authCookies';
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Load messages directly to avoid relying on next-intl config alias resolution.
  const messages = (await import(`../../messages/${locale}.json`)).default;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const analyticsConsentValue = cookieStore.get("analytics_consent")?.value;
  const initialAuth = hasLikelyAuthCookie(cookieHeader)
    ? await getServerAuth(cookieHeader)
    : { isLoggedIn: false, user: null };
  const initialAnalyticsConsent =
    analyticsConsentValue === "true" ? true : analyticsConsentValue === "false" ? false : null;

  return (
    <Providers initialAuth={initialAuth}>
      <NextIntlClientProvider messages={messages}>
        {children}
        <CookieConsent initialConsent={initialAnalyticsConsent} />
        <AnalyticsTracker />
      </NextIntlClientProvider>
    </Providers>
  );
}
