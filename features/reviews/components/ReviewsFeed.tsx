"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { FeedEmpty, FeedEnd, FeedLoading, FeedLoadMore } from "@/shared/components/feed";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import { useReviewsFeed } from "@/features/reviews/hooks/useReviewsFeed";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import type { Review } from "@/lib/types";

interface ReviewsFeedProps {
  initialReviews: Review[];
}

export default function ReviewsFeed({ initialReviews }: ReviewsFeedProps) {
  const t = useTranslations("feed");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { reviews, loading, loadingMore, hasMore, loadMore, updateReviewVote } = useReviewsFeed(initialReviews);

  useInfiniteScroll(sentinelRef, { hasMore, loading, loadingMore, loadMore });

  if (loading) {
    return <FeedLoading />;
  }

  if (reviews.length === 0) {
    return <FeedEmpty message={t("emptyReviews")} />;
  }

  return (
    <>
      {reviews.map((review, index) => (
        <ReviewCard key={review.id || index} review={review} onVoteUpdate={updateReviewVote} />
      ))}
      <div ref={sentinelRef} className="min-h-4" aria-hidden />
      {loadingMore && <FeedLoadMore />}
      {!hasMore && <FeedEnd />}
    </>
  );
}
