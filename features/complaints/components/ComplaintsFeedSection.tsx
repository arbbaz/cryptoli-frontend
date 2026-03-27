"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import AppShell from "@/features/layout/components/AppShell";
import FileComplaintForm from "@/features/complaints/components/FileComplaintForm";
import ComplaintListCard from "@/features/complaints/components/ComplaintListCard";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { useComplaintsFeed } from "@/features/complaints/hooks/useComplaintsFeed";
import { FeedEmpty, FeedEnd, FeedError, FeedLoading, FeedLoadMore } from "@/shared/components/feed";
import type { Complaint } from "@/lib/types";

interface ComplaintsFeedSectionProps {
  initialComplaints: Complaint[];
}

export default function ComplaintsFeedSection({ initialComplaints: _initialComplaints }: ComplaintsFeedSectionProps) {
  void _initialComplaints;
  const t = useTranslations("feed");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { complaints, setComplaints, loading, loadingMore, hasMore, loadMore, fetchComplaints, errorMessage } =
    useComplaintsFeed();

  useInfiniteScroll(sentinelRef, { hasMore, loading, loadingMore, loadMore });

  return (
    <AppShell>
      <FileComplaintForm
        onComplaintSubmitted={(complaint) => {
          setComplaints((prev) => (prev.some((item) => item.id === complaint.id) ? prev : [complaint, ...prev]));
        }}
      />

      {loading ? (
        <FeedLoading />
      ) : errorMessage && complaints.length === 0 ? (
        <FeedError message={errorMessage} onRetry={() => void fetchComplaints()} />
      ) : complaints.length > 0 ? (
        <>
          {complaints.map((complaint, index) => (
            <ComplaintListCard key={complaint.id} complaint={complaint} index={index} />
          ))}
          <div ref={sentinelRef} className="min-h-4" aria-hidden />
          {loadingMore && <FeedLoadMore />}
          {!hasMore && <FeedEnd />}
        </>
      ) : (
        <FeedEmpty message={t("emptyComplaints")} />
      )}
    </AppShell>
  );
}
