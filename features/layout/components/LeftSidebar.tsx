"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { alerts, sidebarMenuKeys, languageItems } from "@/shared/data/uiContent";
import AlertCard from "@/shared/components/feedback/AlertCard";
import SidebarMenuItem from "@/shared/components/layout/SidebarMenuItem";
import Separator from "@/shared/components/ui/Separator";
import { trendingApi } from "@/features/trending/api/client";
import { truncateWithEllipsis } from "@/shared/utils/text";

export default function LeftSidebar() {
  const t = useTranslations();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [sidebarAlerts, setSidebarAlerts] = useState(alerts);

  useEffect(() => {
    let isMounted = true;
    let timerId: number | ReturnType<typeof setTimeout> | null = null;
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const loadTrending = async () => {
      const response = await trendingApi.get({ period: 'week', limit: 1 });
      if (!isMounted) {
        return;
      }
      if (response.error || !response.data?.trendingNow?.length) {
        setSidebarAlerts((prev) =>
          prev.map((item) =>
            item.type === "trending"
              ? {
                  ...item,
                  content: "",
                }
              : item
          )
        );
        return;
      }

      const trendingItem = response.data.trendingNow[0];
      setSidebarAlerts((prev) =>
        prev.map((item) =>
          item.type === "trending"
            ? {
                ...item,
                content: truncateWithEllipsis(trendingItem.name, 42),
              }
            : item
        )
      );
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const id = idleWindow.requestIdleCallback(() => {
        void loadTrending();
      }, { timeout: 1200 });
      timerId = id;
    } else {
      timerId = globalThis.setTimeout(() => {
        void loadTrending();
      }, 400);
    }

    return () => {
      isMounted = false;
      if (timerId != null) {
        if (
          typeof timerId === "number" &&
          typeof idleWindow.cancelIdleCallback === "function"
        ) {
          idleWindow.cancelIdleCallback(timerId);
        } else {
          globalThis.clearTimeout(timerId);
        }
      }
    };
  }, []);

  return (
    <aside className="sidebar-left sidebar-border-right">
      {sidebarAlerts.map((alert, index) => (
        <AlertCard key={alert.type} alert={alert} index={index} />
      ))}
      {sidebarMenuKeys.map((key) => (
        <SidebarMenuItem
          key={key}
          item={t(`sidebar.${key}`)}
          isActive={activeItem === key}
          onClick={() => setActiveItem(key)}
        />
      ))}
      <Separator />
      {languageItems.map((item) => (
        <SidebarMenuItem
          key={item}
          item={t("sidebar.language")}
          isActive={activeItem === item}
          onClick={() => setActiveItem(item)}
        />
      ))}
    </aside>
  );
}
