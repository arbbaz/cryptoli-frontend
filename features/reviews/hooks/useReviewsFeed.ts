"use client";

import { useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/contexts/ToastContext";
import { safeApiMessage } from "@/lib/apiErrors";
import { PAGE_SIZE } from "@/lib/constants";
import { reviewsApi } from "@/features/reviews/api/client";
import { flattenInfiniteFeedItems, updateInfiniteFeedItems } from "@/lib/infiniteFeedCache";
import { queryKeys } from "@/lib/queryKeys";
import type { Review } from "@/lib/types";

const reviewsFeedQueryKey = queryKeys.reviewsFeed({ status: "APPROVED" });

export function useReviewsFeed() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const reviewsQuery = useInfiniteQuery({
    queryKey: reviewsFeedQueryKey,
    queryFn: async ({ pageParam }) => {
      const response = await reviewsApi.list({
        status: "APPROVED",
        limit: PAGE_SIZE,
        page: pageParam,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return {
        reviews: response.data?.reviews ?? [],
        pagination: response.data?.pagination ?? response.pagination ?? {
          page: pageParam,
          total: 0,
          totalPages: 0,
        },
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination || pagination.page >= pagination.totalPages) return undefined;
      return pagination.page + 1;
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const reviews = flattenInfiniteFeedItems(reviewsQuery.data, "reviews");
  const loading = reviewsQuery.isLoading || (reviewsQuery.isFetching && !reviewsQuery.data);
  const loadingMore = reviewsQuery.isFetchingNextPage;
  const hasMore = reviewsQuery.hasNextPage ?? false;
  const errorMessage = reviewsQuery.error instanceof Error
    ? safeApiMessage(reviewsQuery.error.message)
    : null;

  const fetchReviews = useCallback(async () => {
    const result = await reviewsQuery.refetch();
    if (result.error) {
      const message = safeApiMessage(result.error.message);
      showToast(message, "error");
      return;
    }
  }, [reviewsQuery, showToast]);

  const loadMore = useCallback(async () => {
    if (!reviewsQuery.hasNextPage || reviewsQuery.isFetchingNextPage) return;

    const result = await reviewsQuery.fetchNextPage();
    if (result.error) {
      showToast(safeApiMessage(result.error.message), "error");
    }
  }, [reviewsQuery, showToast]);

  const setReviews = useCallback(
    (updater: React.SetStateAction<Review[]>) => {
      updateInfiniteFeedItems<Review, "reviews">(queryClient, {
        queryKey: reviewsFeedQueryKey,
        itemsKey: "reviews",
        updater: (currentReviews) =>
          typeof updater === "function"
            ? (updater as (prev: Review[]) => Review[])(currentReviews)
            : updater,
      });
    },
    [queryClient],
  );

  const updateReviewVote = useCallback(
    (reviewId: string, helpfulCount: number, downVoteCount: number) => {
      updateInfiniteFeedItems<Review, "reviews">(queryClient, {
        queryKey: reviewsFeedQueryKey,
        itemsKey: "reviews",
        updater: (currentReviews) =>
          currentReviews.map((review) =>
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
      });
    },
    [queryClient],
  );

  return {
    reviews,
    setReviews,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    fetchReviews,
    updateReviewVote,
    errorMessage,
  };
}
