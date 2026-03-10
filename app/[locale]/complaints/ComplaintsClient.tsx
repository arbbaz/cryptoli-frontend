"use client";

import { useEffect, useRef } from "react";
import Header from "../../components/Header";
import LeftSidebar from "../../components/LeftSidebar";
import RightSidebar from "../../components/RightSidebar";
import Footer from "../../components/Footer";
import FileComplaintForm from "../../components/FileComplaintForm";
import ComplaintListCard from "../../components/ComplaintListCard";
import { useComplaintsFeed } from "../../../lib/hooks/useComplaintsFeed";
import type { Complaint } from "../../../lib/types";

interface ComplaintsClientProps {
  initialComplaints: Complaint[];
}

export default function ComplaintsClient({ initialComplaints }: ComplaintsClientProps) {
  const { complaints, setComplaints, loading, loadingMore, hasMore, loadMore, fetchComplaints } =
    useComplaintsFeed(initialComplaints);

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
              <FileComplaintForm
                onComplaintSubmitted={(complaint) => {
                  setComplaints((prev) =>
                    prev.some((c) => c.id === complaint.id) ? prev : [complaint, ...prev]
                  );
                }}
              />

              {loading ? (
                <div className="text-center py-8 text-text-primary">
                  Loading complaints...
                </div>
              ) : complaints.length > 0 ? (
                <>
                  {complaints.map((complaint, index) => (
                    <ComplaintListCard
                      key={complaint.id || index}
                      complaint={complaint}
                      index={index}
                    />
                  ))}
                  <div ref={sentinelRef} className="min-h-4" aria-hidden />
                  {loadingMore && (
                    <div className="text-center py-6 text-text-tertiary text-sm">
                      Loading more...
                    </div>
                  )}
                  {!hasMore && complaints.length > 0 && (
                    <div className="text-center py-4 text-text-tertiary text-sm">
                      No more complaints
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-text-primary">
                  No complaints yet. Be the first to file one.
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
