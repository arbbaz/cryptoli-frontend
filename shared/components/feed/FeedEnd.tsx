"use client";

import { useTranslations } from "next-intl";

export default function FeedEnd() {
  const t = useTranslations("feed");
  return (
    <div className="text-center py-4 text-text-tertiary text-sm" role="status">
      {t("noMore")}
    </div>
  );
}
