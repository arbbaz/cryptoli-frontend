"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import { useReviewsFeed } from "@/features/reviews/hooks/useReviewsFeed";
import { useReviewFeed } from "@/features/reviews/contexts/ReviewFeedContext";
import { FeedEmpty, FeedEnd, FeedLoading, FeedLoadMore } from "@/shared/components/feed";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import type { Review } from "@/lib/types";

interface HomeReviewsListProps {
  initialReviews: Review[];
}

export default function HomeReviewsList({ initialReviews }: HomeReviewsListProps) {
  const t = useTranslations("feed");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { registerFeed } = useReviewFeed();
  const { reviews, setReviews, loading, loadingMore, hasMore, loadMore, fetchReviews, updateReviewVote } =
    useReviewsFeed(initialReviews);

  useEffect(() => {
    registerFeed({ setReviews, fetchReviews });
  }, [registerFeed, setReviews, fetchReviews]);

  useInfiniteScroll(sentinelRef, { hasMore, loading, loadingMore, loadMore });

  return (
    <>
      {loading ? (
        <FeedLoading />
      ) : reviews.length > 0 ? (
        <>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onVoteUpdate={updateReviewVote} />
          ))}
          <div ref={sentinelRef} className="min-h-4" aria-hidden />
          {loadingMore && <FeedLoadMore />}
          {!hasMore && <FeedEnd />}
        </>
      ) : (
        <FeedEmpty message={t("emptyReviews")} />
      )}
    </>
  );
}
