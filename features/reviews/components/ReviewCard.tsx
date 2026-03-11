"use client";

import Image from "next/image";
import { LuDot } from "react-icons/lu";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import Separator from "@/shared/components/ui/Separator";
import HighlightFirstWord from "@/shared/components/ui/HighlightFirstWord";
import VoteRail from "@/shared/components/ui/VoteRail";
import CommentThread from "@/features/comments/components/CommentThread";
import { useComments } from "@/features/comments/hooks/useComments";
import { reviewsApi } from "@/features/reviews/api/client";
import { useVote } from "@/shared/hooks/useVote";
import type { Review } from "@/lib/types";

interface ReviewCardProps {
  review: Review;
  onVoteUpdate?: (reviewId: string, helpfulCount: number, downVoteCount: number) => void;
}

export default function ReviewCard({ review, onVoteUpdate }: ReviewCardProps) {
  const t = useTranslations();
  const { isVoting, helpfulCount, downVoteCount, isUpVoted, isDownVoted, handleVote } = useVote({
    entityId: review.id,
    initialHelpfulCount: review.helpfulCount ?? review._count?.helpfulVotes ?? 0,
    initialDownVoteCount: review.downVoteCount ?? 0,
    initialUserVote: review.userVote ?? null,
    voteRequest: reviewsApi.vote,
    onSuccess: (nextHelpfulCount, nextDownVoteCount) => {
      onVoteUpdate?.(review.id, nextHelpfulCount, nextDownVoteCount);
    },
  });

  const {
    showComments,
    comments,
    setComments,
    loadingComments,
    commentContent,
    setCommentContent,
    isSubmittingComment,
    commentCount,
    fetchComments,
    handleToggleComments,
    submitComment,
  } = useComments({ targetKey: "reviewId", targetId: review.id, initialCount: review._count?.comments ?? 0 });

  const authorName = review.author?.username || "Anonymous";

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return t("common.time.hoursAgo");
    }
  };

  const translate = (key: string, fallback: string) => {
    try {
      const result = t(key as never);
      return result === key ? fallback : result;
    } catch {
      return fallback;
    }
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="mr-4 text-lg font-bold leading-[14px] tracking-normal text-primary-dark">
        <span className="text-primary-lighter">{"★".repeat(fullStars)}</span>
        {hasHalfStar && <span className="text-primary-lighter">★</span>}
        <span className="text-gray-300">{"☆".repeat(emptyStars)}</span>
        <span className="ml-1 text-primary-lighter">{score.toFixed(1)}/10</span>
      </span>
    );
  };

  return (
    <article className="card">
      <div className="card-inner">
        <VoteRail
          helpfulCount={helpfulCount}
          downVoteCount={downVoteCount}
          userVote={isUpVoted ? "UP" : isDownVoted ? "DOWN" : null}
          onVote={handleVote}
          disabled={isVoting}
          variant="card"
        />
        <div className="card-body">
          <div className="card-meta">
            <div className="avatar">
              {review.author?.avatar ? <Image src={review.author.avatar} alt={authorName} width={40} height={40} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="card-meta-text">
              <p className="author-name">
                {authorName}
                {review.author?.verified && <span className="ml-1">✓</span>}
              </p>
              <p className="meta-line">
                <span className="meta-muted">{formatTimeAgo(review.createdAt)}</span>
                <span className="meta-muted">•</span>
                <span className="font-semibold text-primary">
                  {t("common.review.category")} • {t("common.review.productCategory")}
                </span>
              </p>
            </div>
          </div>
          <Separator />
          {renderStars(review.overallScore)}
          <h3 className="content-title"><HighlightFirstWord text={review.title} /></h3>
          <p className="content-body">{review.content}</p>
          <div className="action-row">
            <button type="button" onClick={handleToggleComments} className="action-btn-strong">
              {commentCount} {t("common.review.comments")}
            </button>
            <LuDot className="inline-block text-sm font-bold text-text-dark" />
            <button type="button" className="action-btn">{t("common.review.share")}</button>
            <LuDot className="inline-block text-sm font-bold text-text-dark" />
            <button type="button" className="action-btn">{t("common.review.report")}</button>
          </div>

          {showComments && (
            <div className="comment-section">
              <form onSubmit={(event) => { event.preventDefault(); void submitComment(); }} className="mb-4">
                <textarea
                  value={commentContent}
                  onChange={(event) => setCommentContent(event.target.value)}
                  placeholder={translate("common.comment.writeComment", "Write a comment...")}
                  className="comment-form-textarea"
                  rows={3}
                  required
                />
                <button type="submit" disabled={!commentContent.trim() || isSubmittingComment} className="comment-submit-btn">
                  {isSubmittingComment ? t("common.auth.processing") : translate("common.comment.post", "Post Comment")}
                </button>
              </form>

              {loadingComments ? (
                <div className="py-4 text-center text-sm text-text-quaternary">{translate("common.comment.loadingComments", "Loading comments...")}</div>
              ) : comments.length > 0 ? (
                <CommentThread
                  comments={comments}
                  reviewId={review.id}
                  onCommentAdded={() => void fetchComments({ force: true })}
                  onVoteUpdate={(commentId, nextHelpfulCount, nextDownVoteCount) => {
                    setComments((prev) =>
                      prev.map((comment) => (comment.id === commentId ? { ...comment, helpfulCount: nextHelpfulCount, downVoteCount: nextDownVoteCount } : comment)),
                    );
                  }}
                />
              ) : (
                <div className="py-4 text-center text-sm text-text-quaternary">
                  {translate("common.comment.noComments", "No comments yet. Be the first to comment!")}
                </div>
              )}
            </div>
          )}
        </div>
        <Image src="/verify.svg" alt="" width={16} height={16} className="flex-shrink-0" />
      </div>
    </article>
  );
}
