"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reviewsApi } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { useToast } from "@/app/contexts/ToastContext";
import type { Review } from "@/lib/types";

const PAGE_SIZE = 10;

interface VoteUpdatePayload {
  reviewId: string;
  helpfulCount: number;
  downVoteCount?: number;
}

export function useReviewsFeed(initialReviews?: Review[]) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews ?? []);
  const [loading, setLoading] = useState(initialReviews == null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(initialReviews?.length ? 1 : 0);
  const { socket } = useSocket();
  const { showToast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    try {
      const response = await reviewsApi.list({
        status: "APPROVED",
        limit: PAGE_SIZE,
        page: 1,
      });
      if (response.data?.reviews) {
        setReviews(response.data.reviews);
        const pag = response.data.pagination;
        setHasMore(pag ? pag.page < pag.totalPages : false);
        pageRef.current = 1;
      } else if (response.error) {
        showToast(response.error, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    try {
      const response = await reviewsApi.list({
        status: "APPROVED",
        limit: PAGE_SIZE,
        page: nextPage,
      });
      if (response.data?.reviews?.length) {
        setReviews((prev) => [...prev, ...response.data!.reviews]);
        const pag = response.data!.pagination;
        setHasMore(pag ? pag.page < pag.totalPages : false);
        pageRef.current = nextPage;
      } else {
        setHasMore(false);
      }
      if (response.error) {
        showToast(response.error, "error");
      }
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, showToast]);

  const updateReviewVote = useCallback((reviewId: string, helpfulCount: number, downVoteCount: number) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              helpfulCount,
              downVoteCount,
              _count: {
                ...review._count,
                helpfulVotes: helpfulCount,
              },
            }
          : review
      )
    );
  }, []);

  useEffect(() => {
    if (initialReviews == null) {
      void fetchReviews();
    } else {
      pageRef.current = 1;
      setHasMore(initialReviews.length >= PAGE_SIZE);
    }
  }, [fetchReviews, initialReviews]);

  useEffect(() => {
    if (!socket) return;

    const handleReviewCreated = (newReview: Review) => {
      if (!newReview || !newReview.id) return;

      setReviews((prevReviews) => {
        if (prevReviews.some((review) => review.id === newReview.id)) return prevReviews;
        return [newReview, ...prevReviews];
      });
    };

    const handleVoteUpdated = (data: VoteUpdatePayload) => {
      if (!data?.reviewId) return;
      updateReviewVote(data.reviewId, data.helpfulCount, data.downVoteCount ?? 0);
    };

    const handleReviewUpdated = (updatedReview: Review) => {
      if (!updatedReview?.id) return;

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === updatedReview.id ? { ...review, ...updatedReview } : review
        )
      );
    };

    socket.on("review:created", handleReviewCreated);
    socket.on("review:vote:updated", handleVoteUpdated);
    socket.on("review:updated", handleReviewUpdated);

    return () => {
      socket.off("review:created", handleReviewCreated);
      socket.off("review:vote:updated", handleVoteUpdated);
      socket.off("review:updated", handleReviewUpdated);
    };
  }, [socket, updateReviewVote]);

  return {
    reviews,
    setReviews,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    fetchReviews,
    updateReviewVote,
  };
}
