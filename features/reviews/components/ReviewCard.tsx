"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LuDot } from "react-icons/lu";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usersApi } from "@/features/users/api/client";
import Separator from "@/shared/components/ui/Separator";
import HighlightFirstWord from "@/shared/components/ui/HighlightFirstWord";
import VoteRail from "@/shared/components/ui/VoteRail";
import CommentThread from "@/features/comments/components/CommentThread";
import { useComments } from "@/features/comments/hooks/useComments";
import ReviewScore from "@/features/reviews/components/ReviewScore";
import { formatReviewTimeAgo, translateWithFallback } from "@/features/reviews/utils/reviewFormatting";
import { reviewsApi } from "@/features/reviews/api/client";
import { useVote } from "@/shared/hooks/useVote";
import type { Review } from "@/lib/types";

interface ReviewCardProps {
  review: Review;
  onVoteUpdate?: (reviewId: string, helpfulCount: number, downVoteCount: number) => void;
}

export default function ReviewCard({ review, onVoteUpdate }: ReviewCardProps) {
  const t = useTranslations();
  const { helpfulCount, downVoteCount, isUpVoted, isDownVoted, handleVote } = useVote({
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
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const authorProfileHref =
    review.author?.username ? `/${locale}/users/${encodeURIComponent(review.author.username)}` : undefined;

  const { user: currentUser } = useAuth();
  const isOwnReview = currentUser?.username && review.author?.username === currentUser.username;
  const canFollow = Boolean(currentUser && review.author?.username && !isOwnReview);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!canFollow || !review.author?.username) return;
    usersApi.getFollowStatus(review.author.username).then((res) => {
      if (!res.error && res.data) setIsFollowingAuthor(res.data.following);
    });
  }, [canFollow, review.author?.username]);

  const handleFollowClick = () => {
    if (!review.author?.username || followLoading) return;
    setFollowLoading(true);
    if (isFollowingAuthor) {
      usersApi.unfollow(review.author.username).then((res) => {
        if (!res.error) setIsFollowingAuthor(false);
        setFollowLoading(false);
      });
    } else {
      usersApi.follow(review.author.username).then((res) => {
        if (!res.error) setIsFollowingAuthor(true);
        setFollowLoading(false);
      });
    }
  };

  const timeAgoLabel = formatReviewTimeAgo(review.createdAt, t("common.time.hoursAgo"));
  const commentPlaceholder = translateWithFallback(t, "common.comment.writeComment", "Write a comment...");
  const postCommentLabel = translateWithFallback(t, "common.comment.post", "Post Comment");
  const loadingCommentsLabel = translateWithFallback(t, "common.comment.loadingComments", "Loading comments...");
  const emptyCommentsLabel = translateWithFallback(
    t,
    "common.comment.noComments",
    "No comments yet. Be the first to comment!",
  );

  return (
    <article className="card">
      <div className="card-inner">
        <VoteRail
          helpfulCount={helpfulCount}
          downVoteCount={downVoteCount}
          userVote={isUpVoted ? "UP" : isDownVoted ? "DOWN" : null}
          onVote={handleVote}
          variant="card"
        />
        <div className="card-body">
          <div className="card-meta">
            <div className="avatar">
              {review.author?.avatar ? <Image src={review.author.avatar} alt={authorName} width={40} height={40} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="card-meta-text flex-1 min-w-0">
              <p className="author-name flex flex-wrap items-center gap-2">
                {authorProfileHref ? (
                  <Link href={authorProfileHref} className="hover:text-primary transition-colors">
                    {authorName}
                  </Link>
                ) : (
                  authorName
                )}
                {review.author?.verified && <span className="ml-1">✓</span>}
                {canFollow && (
                  <button
                    type="button"
                    onClick={handleFollowClick}
                    disabled={followLoading}
                    className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition disabled:opacity-50 ${
                      isFollowingAuthor
                        ? "border border-[#E5E5E5] bg-white text-text-secondary hover:border-primary hover:text-primary"
                        : "btn-primary"
                    }`}
                  >
                    {followLoading ? "…" : isFollowingAuthor ? "Following" : "Follow"}
                  </button>
                )}
              </p>
              <p className="meta-line">
                <span className="meta-muted">{timeAgoLabel}</span>
                <span className="meta-muted">•</span>
                <span className="font-semibold text-primary">
                  {t("common.review.category")} • {t("common.review.productCategory")}
                </span>
              </p>
            </div>
          </div>
          <Separator />
          <ReviewScore score={review.overallScore} />
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
                  placeholder={commentPlaceholder}
                  className="comment-form-textarea"
                  rows={3}
                  required
                />
                <button type="submit" disabled={!commentContent.trim() || isSubmittingComment} className="comment-submit-btn">
                  {isSubmittingComment ? t("common.auth.processing") : postCommentLabel}
                </button>
              </form>

              {loadingComments ? (
                <div className="py-4 text-center text-sm text-text-quaternary">{loadingCommentsLabel}</div>
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
                  {emptyCommentsLabel}
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
