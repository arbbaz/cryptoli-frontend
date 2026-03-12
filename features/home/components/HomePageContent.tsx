"use client";

import type { ReactNode } from "react";
import { ReviewFeedProvider } from "@/features/reviews/contexts/ReviewFeedContext";
import CompanyProfileSection from "@/features/reviews/components/CompanyProfileSection";

interface HomePageContentProps {
  children: ReactNode;
}

export default function HomePageContent({ children }: HomePageContentProps) {
  return (
    <ReviewFeedProvider>
      <CompanyProfileSection />
      {children}
    </ReviewFeedProvider>
  );
}
