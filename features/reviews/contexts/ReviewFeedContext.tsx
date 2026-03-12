"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import type { Review } from "@/lib/types";

type FeedHandlers = {
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  fetchReviews: () => Promise<void>;
};

type ReviewFeedContextValue = {
  registerFeed: (handlers: FeedHandlers) => void;
  addReview: (newReview?: unknown) => void;
};

const ReviewFeedContext = createContext<ReviewFeedContextValue | null>(null);

export function ReviewFeedProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<FeedHandlers | null>(null);

  const registerFeed = useCallback((handlers: FeedHandlers) => {
    handlersRef.current = handlers;
  }, []);

  const addReview = useCallback((newReview?: unknown) => {
    const h = handlersRef.current;
    if (!h) return;
    if (newReview && typeof newReview === "object" && "id" in newReview) {
      const typed = newReview as Review;
      h.setReviews((prev) =>
        prev.some((r) => r.id === typed.id) ? prev : [typed, ...prev]
      );
      return;
    }
    void h.fetchReviews();
  }, []);

  return (
    <ReviewFeedContext.Provider value={{ registerFeed, addReview }}>
      {children}
    </ReviewFeedContext.Provider>
  );
}

export function useReviewFeed(): ReviewFeedContextValue {
  const ctx = useContext(ReviewFeedContext);
  if (!ctx) {
    return {
      registerFeed: () => {},
      addReview: () => {},
    };
  }
  return ctx;
}
