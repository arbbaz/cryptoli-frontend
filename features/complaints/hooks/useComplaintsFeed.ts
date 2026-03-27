"use client";

import { useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/contexts/ToastContext";
import { safeApiMessage } from "@/lib/apiErrors";
import { PAGE_SIZE } from "@/lib/constants";
import { complaintsApi } from "@/features/complaints/api/client";
import { flattenInfiniteFeedItems, updateInfiniteFeedItems } from "@/lib/infiniteFeedCache";
import { queryKeys } from "@/lib/queryKeys";
import type { Complaint } from "@/lib/types";

const complaintsFeedQueryKey = queryKeys.complaintsFeed();

export function useComplaintsFeed() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const complaintsQuery = useInfiniteQuery({
    queryKey: complaintsFeedQueryKey,
    queryFn: async ({ pageParam }) => {
      const response = await complaintsApi.list({
        limit: PAGE_SIZE,
        page: pageParam,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return {
        complaints: response.data?.complaints ?? [],
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

  const complaints = flattenInfiniteFeedItems(complaintsQuery.data, "complaints");
  const loading = complaintsQuery.isLoading || (complaintsQuery.isFetching && !complaintsQuery.data);
  const loadingMore = complaintsQuery.isFetchingNextPage;
  const hasMore = complaintsQuery.hasNextPage ?? false;
  const errorMessage = complaintsQuery.error instanceof Error
    ? safeApiMessage(complaintsQuery.error.message)
    : null;

  const fetchComplaints = useCallback(async () => {
    const result = await complaintsQuery.refetch();
    if (result.error) {
      const message = safeApiMessage(result.error.message);
      showToast(message, "error");
    }
  }, [complaintsQuery, showToast]);

  const loadMore = useCallback(async () => {
    if (!complaintsQuery.hasNextPage || complaintsQuery.isFetchingNextPage) return;

    const result = await complaintsQuery.fetchNextPage();
    if (result.error) {
      showToast(safeApiMessage(result.error.message), "error");
    }
  }, [complaintsQuery, showToast]);

  const setComplaints = useCallback(
    (updater: React.SetStateAction<Complaint[]>) => {
      updateInfiniteFeedItems<Complaint, "complaints">(queryClient, {
        queryKey: complaintsFeedQueryKey,
        itemsKey: "complaints",
        updater: (currentComplaints) =>
          typeof updater === "function"
            ? (updater as (prev: Complaint[]) => Complaint[])(currentComplaints)
            : updater,
      });
    },
    [queryClient],
  );

  return {
    complaints,
    setComplaints,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    fetchComplaints,
    errorMessage,
  };
}
