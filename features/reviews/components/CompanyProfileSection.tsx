"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CompanyHero from "@/features/reviews/components/CompanyHero";
import ReviewComposer from "@/features/reviews/components/ReviewComposer";

interface CompanyProfileSectionProps {
  onReviewSubmitted?: (newReview?: unknown) => void;
}

export default function CompanyProfileSection({ onReviewSubmitted }: CompanyProfileSectionProps) {
  const { isLoggedIn } = useAuth();

  return (
    <div className="pt-8 sm:pt-12 lg:pt-16">
      <div className="card-base">
        <CompanyHero isLoggedIn={isLoggedIn} />
        {isLoggedIn && <ReviewComposer onReviewSubmitted={onReviewSubmitted} />}
      </div>
    </div>
  );
}
