"use client";

import AppShell from "@/features/layout/components/AppShell";
import HomeReviewsSection from "@/features/reviews/components/HomeReviewsSection";
import type { Review } from "@/lib/types";

interface HomePageClientProps {
  initialReviews: Review[];
}

export default function HomePageClient({ initialReviews }: HomePageClientProps) {
  return (
    <AppShell>
      <HomeReviewsSection initialReviews={initialReviews} />
    </AppShell>
  );
}
