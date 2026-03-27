"use client";

import { useEffect, useRef } from "react";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import { useReviewsFeed } from "@/features/reviews/hooks/useReviewsFeed";
import { useReviewAuthorsFollowStatus } from "@/features/reviews/hooks/useReviewAuthorsFollowStatus";
import { useReviewFeed } from "@/features/reviews/contexts/ReviewFeedContext";
import { FeedEmpty, FeedEnd, FeedError, FeedLoading, FeedLoadMore } from "@/shared/components/feed";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import type { Review } from "@/lib/types";

interface HomeReviewsListProps {
  initialReviews: Review[];
  emptyMessage?: string;
}

export default function HomeReviewsList({ initialReviews: _initialReviews, emptyMessage }: HomeReviewsListProps) {
  void _initialReviews;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { registerFeed } = useReviewFeed();
  const { reviews, setReviews, loading, loadingMore, hasMore, loadMore, fetchReviews, updateReviewVote, errorMessage } =
    useReviewsFeed();
  const followStatusByUsername = useReviewAuthorsFollowStatus(reviews);

  useEffect(() => {
    registerFeed({ setReviews, fetchReviews });
  }, [registerFeed, setReviews, fetchReviews]);

  useInfiniteScroll(sentinelRef, { hasMore, loading, loadingMore, loadMore });

  return (
    <>
      {loading ? (
        <FeedLoading />
      ) : errorMessage && reviews.length === 0 ? (
        <FeedError message={errorMessage} onRetry={() => void fetchReviews()} />
      ) : reviews.length > 0 ? (
        <>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
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
      ) : (
        <FeedEmpty message={emptyMessage ?? "No reviews yet."} />
      )}
    </>
  );
}
