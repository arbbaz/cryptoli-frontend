"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { FeedEmpty, FeedEnd, FeedError, FeedLoading, FeedLoadMore } from "@/shared/components/feed";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import { useReviewsFeed } from "@/features/reviews/hooks/useReviewsFeed";
import { useReviewAuthorsFollowStatus } from "@/features/reviews/hooks/useReviewAuthorsFollowStatus";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import type { Review } from "@/lib/types";

interface ReviewsFeedProps {
  initialReviews: Review[];
}

export default function ReviewsFeed({ initialReviews: _initialReviews }: ReviewsFeedProps) {
  void _initialReviews;
  const t = useTranslations("feed");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { reviews, loading, loadingMore, hasMore, loadMore, updateReviewVote, fetchReviews, errorMessage } =
    useReviewsFeed();
  const followStatusByUsername = useReviewAuthorsFollowStatus(reviews);

  useInfiniteScroll(sentinelRef, { hasMore, loading, loadingMore, loadMore });

  if (loading) {
    return <FeedLoading />;
  }

  if (reviews.length === 0) {
    if (errorMessage) {
      return <FeedError message={errorMessage} onRetry={() => void fetchReviews()} />;
    }
    return <FeedEmpty message={t("emptyReviews")} />;
  }

  return (
    <>
      {reviews.map((review, index) => (
        <ReviewCard
          key={review.id || index}
          review={review}
          onVoteUpdate={updateReviewVote}
          isFollowingAuthor={
            review.author?.username !== undefined
              ? followStatusByUsername[review.author.username]
              : false
          }
        />
      ))}
      <div ref={sentinelRef} className="min-h-4" aria-hidden />
      {loadingMore && <FeedLoadMore />}
      {!hasMore && <FeedEnd />}
    </>
  );
}
