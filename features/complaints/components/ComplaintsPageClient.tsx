"use client";

import ComplaintsFeedSection from "@/features/complaints/components/ComplaintsFeedSection";
import type { Complaint } from "@/lib/types";

interface ComplaintsPageClientProps {
  initialComplaints: Complaint[];
}

export default function ComplaintsPageClient({ initialComplaints }: ComplaintsPageClientProps) {
  return <ComplaintsFeedSection initialComplaints={initialComplaints} />;
}
