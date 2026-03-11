"use client";

import { useTranslations } from "next-intl";

export default function FeedLoading() {
  const t = useTranslations("feed");
  return (
    <div className="text-center py-8 text-text-primary" role="status" aria-live="polite">
      {t("loading")}
    </div>
  );
}
