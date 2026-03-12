"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/lib/contexts/ToastContext";
import { safeApiMessage } from "@/lib/apiErrors";
import { PAGE_SIZE } from "@/lib/constants";
import { useSocket } from "@/lib/socket";
import { reviewsApi } from "@/features/reviews/api/client";
import type { Review } from "@/lib/types";

interface VoteUpdatePayload {
  reviewId: string;
  helpfulCount: number;
  downVoteCount?: number;
}

/**
 * When initialReviewsFromServer is provided, we treat it as page 1 from SSR and do not refetch on mount.
 * When it is undefined, we fetch the first page on mount.
 */
export function useReviewsFeed(initialReviewsFromServer?: Review[]) {
  const [reviews, setReviews] = useState<Review[]>(initialReviewsFromServer ?? []);
  const [loading, setLoading] = useState(initialReviewsFromServer == null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(initialReviewsFromServer?.length ? 1 : 0);
  const { socket } = useSocket();
  const { showToast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    try {
      const response = await reviewsApi.list({ status: "APPROVED", limit: PAGE_SIZE, page: 1 });
      if (response.data?.reviews) {
        setReviews(response.data.reviews);
        const pag = response.data.pagination;
        setHasMore(pag ? pag.page < pag.totalPages : false);
        pageRef.current = 1;
      } else if (response.error) {
        showToast(safeApiMessage(response.error), "error");
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
      const response = await reviewsApi.list({ status: "APPROVED", limit: PAGE_SIZE, page: nextPage });
      if (response.data?.reviews?.length) {
        const data = response.data;
        setReviews((prev) => [...prev, ...data.reviews]);
        const pag = data.pagination;
        setHasMore(pag ? pag.page < pag.totalPages : false);
        pageRef.current = nextPage;
      } else {
        setHasMore(false);
      }
      if (response.error) {
        showToast(safeApiMessage(response.error), "error");
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
          : review,
      ),
    );
  }, []);

  // When initialReviewsFromServer is provided, treat as SSR page 1 and do not refetch; otherwise fetch on mount.
  useEffect(() => {
    if (initialReviewsFromServer == null) {
      void fetchReviews();
    } else {
      pageRef.current = 1;
      setHasMore(initialReviewsFromServer.length >= PAGE_SIZE);
    }
  }, [fetchReviews, initialReviewsFromServer]);

  useEffect(() => {
    if (!socket) return;

    const handleReviewCreated = (newReview: Review) => {
      if (!newReview?.id) return;
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
        prevReviews.map((review) => (review.id === updatedReview.id ? { ...review, ...updatedReview } : review)),
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

  return { reviews, setReviews, loading, loadingMore, hasMore, loadMore, fetchReviews, updateReviewVote };
}
