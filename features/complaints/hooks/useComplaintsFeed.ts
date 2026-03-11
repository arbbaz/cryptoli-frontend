"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/lib/contexts/ToastContext";
import { safeApiMessage } from "@/lib/apiErrors";
import { PAGE_SIZE } from "@/lib/constants";
import { complaintsApi } from "@/features/complaints/api/client";
import type { Complaint } from "@/lib/types";

export function useComplaintsFeed(initialComplaints?: Complaint[]) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints ?? []);
  const [loading, setLoading] = useState(initialComplaints == null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(initialComplaints?.length ? 1 : 0);
  const { showToast } = useToast();

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    try {
      const response = await complaintsApi.list({ limit: PAGE_SIZE, page: 1 });
      if (response.data?.complaints) {
        setComplaints(response.data.complaints);
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
      const response = await complaintsApi.list({ limit: PAGE_SIZE, page: nextPage });
      if (response.data?.complaints?.length) {
        const data = response.data;
        setComplaints((prev) => [...prev, ...data.complaints]);
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

  useEffect(() => {
    if (initialComplaints == null) {
      void fetchComplaints();
    } else {
      pageRef.current = 1;
      setHasMore(initialComplaints.length >= PAGE_SIZE);
    }
  }, [fetchComplaints, initialComplaints]);

  return { complaints, setComplaints, loading, loadingMore, hasMore, loadMore, fetchComplaints };
}
