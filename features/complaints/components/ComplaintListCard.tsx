"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import Separator from "@/shared/components/ui/Separator";
import HighlightFirstWord from "@/shared/components/ui/HighlightFirstWord";
import type { Complaint } from "@/lib/types";

const statusClass: Record<string, string> = {
  OPEN: "status-badge status-open",
  IN_PROGRESS: "status-badge status-in-progress",
  RESOLVED: "status-badge status-resolved",
  CLOSED: "status-badge status-closed",
};

interface ComplaintListCardProps {
  complaint: Complaint;
  index: number;
}

export default function ComplaintListCard({ complaint, index: _index }: ComplaintListCardProps) {
  const t = useTranslations();
  const authorName = complaint.author?.username || "Anonymous";
  void _index;

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return t("common.time.hoursAgo");
    }
  };

  return (
    <article className="card">
      <div className="card-inner">
        <div className="card-body min-w-0 flex-1">
          <div className="card-meta mb-2">
            <div className="avatar">
              {complaint.author?.avatar ? (
                <Image src={complaint.author.avatar} alt={authorName} width={40} height={40} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="card-meta-text">
              <p className="author-name">
                {authorName}
                {complaint.author?.verified && <span className="ml-1">✓</span>}
              </p>
              <p className="meta-line">
                <span className="meta-muted">{formatTimeAgo(complaint.createdAt)}</span>
                <span className="meta-muted">•</span>
                <span className={statusClass[complaint.status] ?? statusClass.OPEN}>{complaint.status.replace("_", " ")}</span>
              </p>
            </div>
          </div>
          <Separator />
          <h3 className="content-title"><HighlightFirstWord text={complaint.title} /></h3>
          <p className="content-body">{complaint.content}</p>
        </div>
        <Image src="/verify.svg" alt="" width={16} height={16} className="flex-shrink-0" />
      </div>
    </article>
  );
}
