"use client";

import { useEffect } from "react";
import { FEED_INFINITE_SCROLL_ROOT_MARGIN } from "@/lib/constants";

export interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  loadMore: () => void | Promise<void>;
}

/**
 * Observes a sentinel element and calls loadMore when it enters the viewport.
 * Use with a ref on a sentinel div at the end of your list.
 */
export function useInfiniteScroll(
  sentinelRef: React.RefObject<HTMLDivElement | null>,
  options: UseInfiniteScrollOptions
) {
  const { hasMore, loading, loadingMore, loadMore } = options;

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: FEED_INFINITE_SCROLL_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore, loading, sentinelRef]);
}
