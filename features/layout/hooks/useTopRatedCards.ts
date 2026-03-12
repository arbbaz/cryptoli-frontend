"use client";

import { useEffect, useState } from "react";
import { topRatedCards } from "@/shared/data/uiContent";
import { trendingApi } from "@/features/trending/api/client";
import { truncateWithEllipsis } from "@/shared/utils/text";

export interface SidebarTopRatedCard {
  title: string;
  product: {
    name: string;
    score: string;
    reviews: string;
    companies: string;
    badge: { text: string; color: string };
    description: string;
    bgColor: string;
    textColor: string;
    scoreColor: string;
    separatorColor: string;
    hasVerify?: boolean;
  };
}

export function useTopRatedCards() {
  const [cards, setCards] = useState<SidebarTopRatedCard[]>(() =>
    topRatedCards.slice(0, 2).map((card) => ({
      title: card.title,
      product: { ...card.product, hasVerify: card.product.hasVerify },
    })),
  );

  useEffect(() => {
    let active = true;
    let timerId: number | ReturnType<typeof setTimeout> | null = null;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const loadTopRated = async () => {
      const response = await trendingApi.get({ period: "week", limit: 2 });
      if (!active || response.error || !response.data?.topRatedThisWeek?.length) {
        return;
      }

      const nextCards = response.data.topRatedThisWeek.slice(0, 2).map((item, index) => ({
        title: "Top rated this week",
        product: {
          name: truncateWithEllipsis(item.name, 26),
          score: `${item.averageScore.toFixed(1)}/10`,
          reviews: `${item.reviewCount} Reviews`,
          companies: "1",
          badge:
            index === 0
              ? { text: "Rising", color: "bg-accent-blue" }
              : { text: "New", color: "bg-alert-orange-light" },
          description: truncateWithEllipsis(item.description || item.name, 92),
          bgColor: index === 0 ? "bg-dark-card" : "bg-card-purple-light-bg",
          textColor: index === 0 ? "text-white" : "text-text-dark",
          scoreColor: index === 0 ? "text-emerald" : "text-primary-light",
          separatorColor: index === 0 ? "bg-border-gray" : "bg-card-purple-light-border",
          hasVerify: index === 1,
        },
      }));

      setCards(nextCards);
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      timerId = idleWindow.requestIdleCallback(() => {
        void loadTopRated();
      }, { timeout: 1400 });
    } else {
      timerId = globalThis.setTimeout(() => {
        void loadTopRated();
      }, 450);
    }

    return () => {
      active = false;
      if (timerId != null) {
        if (typeof timerId === "number" && typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(timerId);
        } else {
          globalThis.clearTimeout(timerId);
        }
      }
    };
  }, []);

  return cards;
}
