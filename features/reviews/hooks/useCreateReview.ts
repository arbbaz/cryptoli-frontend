"use client";

import { useState } from "react";
import { useToast } from "@/lib/contexts/ToastContext";
import type { Review } from "@/lib/types";
import { safeApiMessage } from "@/lib/apiErrors";
import { createReviewSchema } from "@/lib/validations";
import { reviewsApi } from "@/features/reviews/api/client";

export function useCreateReview(onReviewSubmitted?: (newReview?: Review) => void) {
  const { showToast } = useToast();
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const parsed = createReviewSchema.safeParse({
      title: reviewTitle,
      content: reviewContent,
      overallScore: rating,
      criteriaScores: { overall: rating },
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);
    try {
      const response = await reviewsApi.create({
        title: parsed.data.title,
        content: parsed.data.content,
        overallScore: parsed.data.overallScore,
        criteriaScores: parsed.data.criteriaScores ?? { overall: parsed.data.overallScore },
      });

      if (response.error) {
        const message = safeApiMessage(response.error);
        setError(message);
        showToast(message, "error");
        return;
      }

      setReviewTitle("");
      setReviewContent("");
      setRating(0);
      onReviewSubmitted?.(response.data);
    } catch (error) {
      const raw = error instanceof Error ? error.message : "An error occurred. Please try again.";
      const message = safeApiMessage(raw);
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    reviewTitle,
    setReviewTitle,
    reviewContent,
    setReviewContent,
    rating,
    setRating,
    submitting,
    error,
    handleSubmit,
  };
}
