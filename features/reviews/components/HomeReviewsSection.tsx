"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import CompanyProfileSection from "@/features/reviews/components/CompanyProfileSection";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import { useReviewsFeed } from "@/features/reviews/hooks/useReviewsFeed";
import { FeedEmpty, FeedEnd, FeedLoading, FeedLoadMore } from "@/shared/components/feed";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import type { Review } from "@/lib/types";

interface HomeReviewsSectionProps {
  initialReviews: Review[];
}

export default function HomeReviewsSection({ initialReviews }: HomeReviewsSectionProps) {
  const t = useTranslations("feed");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { reviews, setReviews, loading, loadingMore, hasMore, loadMore, fetchReviews, updateReviewVote } =
    useReviewsFeed(initialReviews);

  useInfiniteScroll(sentinelRef, { hasMore, loading, loadingMore, loadMore });

  return (
    <>
      <CompanyProfileSection
        onReviewSubmitted={(newReview) => {
          if (newReview && typeof newReview === "object" && "id" in newReview) {
            const typedReview = newReview as Review;
            setReviews((prevReviews) =>
              prevReviews.some((review) => review.id === typedReview.id) ? prevReviews : [typedReview, ...prevReviews],
            );
            return;
          }
          void fetchReviews();
        }}
      />

      {loading ? (
        <FeedLoading />
      ) : reviews.length > 0 ? (
        <>
          {reviews.map((review, index) => (
            <ReviewCard key={review.id || index} review={review} onVoteUpdate={updateReviewVote} />
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
