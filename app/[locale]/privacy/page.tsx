import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    openGraph: {
      title: t("privacyTitle"),
      description: t("privacyDescription"),
    },
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <div className="page-container content-section mx-auto max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-text-heading">{t("title")}</h1>
      <p className="mt-2 text-sm text-text-secondary">{t("lastUpdated")}</p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-text-heading">{t("analyticsHeading")}</h2>
        <p className="mt-2 text-body-sm text-text-primary">{t("analyticsBody")}</p>
        <ul className="mt-2 list-inside list-disc text-body-sm text-text-primary">
          <li>{t("analyticsIp")}</li>
          <li>{t("analyticsLocation")}</li>
          <li>{t("analyticsDevice")}</li>
          <li>{t("analyticsBrowser")}</li>
          <li>{t("analyticsVisitTime")}</li>
          <li>{t("analyticsTimezone")}</li>
          <li>{t("analyticsSessionId")}</li>
          <li>{t("analyticsReferrer")}</li>
          <li>{t("analyticsUtm")}</li>
          <li>{t("analyticsFunnel")}</li>
          <li>{t("analyticsUa")}</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-text-heading">{t("serverSideHeading")}</h2>
        <p className="mt-2 text-body-sm text-text-primary">{t("serverSideBody")}</p>
        <ul className="mt-2 list-inside list-disc text-body-sm text-text-primary">
          <li>{t("serverSideLogin")}</li>
          <li>{t("serverSideReview")}</li>
          <li>{t("serverSideVote")}</li>
          <li>{t("serverSideFollow")}</li>
          <li>{t("serverSideSearch")}</li>
        </ul>
        <p className="mt-2 text-body-sm text-text-secondary">{t("serverSideNote")}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-text-heading">{t("cookiesHeading")}</h2>
        <p className="mt-2 text-body-sm text-text-primary">{t("cookiesBody")}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-text-heading">{t("storageHeading")}</h2>
        <p className="mt-2 text-body-sm text-text-primary">{t("storageBody")}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-text-heading">{t("choicesHeading")}</h2>
        <p className="mt-2 text-body-sm text-text-primary">{t("choicesBody")}</p>
      </section>

      <p className="mt-8">
        <Link href="/" className="text-primary underline hover:opacity-90">
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}
