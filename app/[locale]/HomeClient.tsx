"use client";

import { useEffect, useRef } from "react";
import Header from "../components/Header";
import LeftSidebar from "../components/LeftSidebar";
import CompanyProfile from "../components/CompanyProfile";
import ReviewCard from "../components/ReviewCard";
import RightSidebar from "../components/RightSidebar";
import Footer from "../components/Footer";
import { useReviewsFeed } from "../../lib/hooks/useReviewsFeed";
import type { Review } from "../../lib/types";

interface HomeClientProps {
  initialReviews: Review[];
}

export default function HomeClient({ initialReviews }: HomeClientProps) {
  const { reviews, setReviews, loading, loadingMore, hasMore, loadMore, fetchReviews, updateReviewVote } =
    useReviewsFeed(initialReviews);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore, loading]);

  return (
    <div className="bg-bg-white text-foreground">
      <Header />
      <div className="page-container">
        <div className="page-main-wrap">
          <main className="main-grid">
            <LeftSidebar />

            <section className="content-section">
              <CompanyProfile
                onReviewSubmitted={(newReview) => {
                  if (newReview && typeof newReview === "object" && "id" in newReview) {
                    const typedReview = newReview as Review;
                    setReviews((prevReviews) =>
                      prevReviews.some((review) => review.id === typedReview.id)
                        ? prevReviews
                        : [typedReview, ...prevReviews]
                    );
                    return;
                  }
                  void fetchReviews();
                }}
              />

              {loading ? (
                <div className="text-center py-8 text-text-primary">Loading reviews...</div>
              ) : reviews.length > 0 ? (
                <>
                  {reviews.map((review, index) => (
                    <ReviewCard
                      key={review.id || index}
                      review={review}
                      index={index}
                      onVoteUpdate={updateReviewVote}
                    />
                  ))}
                  <div ref={sentinelRef} className="min-h-4" aria-hidden />
                  {loadingMore && (
                    <div className="text-center py-6 text-text-tertiary text-sm">Loading more...</div>
                  )}
                  {!hasMore && reviews.length > 0 && (
                    <div className="text-center py-4 text-text-tertiary text-sm">No more reviews</div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-text-primary">
                  No reviews yet. Be the first to review!
                </div>
              )}
            </section>

            <RightSidebar />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
