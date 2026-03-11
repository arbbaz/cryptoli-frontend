"use client";

import StarRating from "@/shared/components/ui/StarRating";
import { useTranslations } from "next-intl";
import { useCreateReview } from "@/features/reviews/hooks/useCreateReview";
import type { Review } from "@/lib/types";

const MIN_REVIEW_CONTENT_LENGTH = 20;

interface ReviewComposerProps {
  onReviewSubmitted?: (newReview?: Review) => void;
}

export default function ReviewComposer({ onReviewSubmitted }: ReviewComposerProps) {
  const t = useTranslations();
  const {
    reviewTitle,
    setReviewTitle,
    reviewContent,
    setReviewContent,
    rating,
    setRating,
    submitting,
    error,
    handleSubmit,
  } = useCreateReview(onReviewSubmitted);

  return (
    <div className="mt-3 card-light p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex h-auto flex-col items-start gap-2 border-b border-border-light px-3 py-2 sm:h-10 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
          <StarRating rating={rating} onRatingChange={setRating} maxRating={10} size={18} />
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-inter text-sm font-normal leading-[14px] tracking-normal text-text-primary">
              {t("companyProfile.howWouldYouRate")} {"  "}
            </span>
            <span className="text-sm font-semibold leading-[14px] tracking-normal text-primary">Companyprofile</span>
          </div>
        </div>
        <input
          type="text"
          placeholder={t("companyProfile.reviewTitle")}
          value={reviewTitle}
          onChange={(event) => setReviewTitle(event.target.value)}
          className="textarea-field w-full py-3 text-base"
          required
        />
        <textarea
          placeholder={t("companyProfile.reviewContent")}
          value={reviewContent}
          onChange={(event) => setReviewContent(event.target.value)}
          rows={6}
          minLength={MIN_REVIEW_CONTENT_LENGTH}
          className="textarea-field mt-3 w-full text-[13px]"
          required
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-submit-review">
          {submitting ? t("common.auth.processing") : t("companyProfile.submitReview")}
        </button>
      </form>
    </div>
  );
}
