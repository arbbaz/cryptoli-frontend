"use client";

import { useTranslations } from "next-intl";

export default function FeedLoadMore() {
  const t = useTranslations("feed");
  return (
    <div className="text-center py-6 text-text-tertiary text-sm" role="status" aria-live="polite">
      {t("loadMore")}
    </div>
  );
}
