"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/lib/contexts/ToastContext";
import { safeApiMessage } from "@/lib/apiErrors";
import { createCommentSchema } from "@/lib/validations";
import VoteRail from "@/shared/components/ui/VoteRail";
import { commentsApi } from "@/features/comments/api/client";
import type { Comment } from "@/lib/types";

interface CommentThreadProps {
  comments: Comment[];
  reviewId?: string;
  postId?: string;
  complaintId?: string;
  onCommentAdded?: () => void;
  onVoteUpdate?: (commentId: string, helpfulCount: number, downVoteCount: number) => void;
  maxDepth?: number;
}

export default function CommentThread({ comments, reviewId, postId, complaintId, onCommentAdded, onVoteUpdate, maxDepth = 5 }: CommentThreadProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          reviewId={reviewId}
          postId={postId}
          complaintId={complaintId}
          onCommentAdded={onCommentAdded}
          onVoteUpdate={onVoteUpdate}
          depth={0}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
}

interface CommentItemProps extends Omit<CommentThreadProps, "comments"> {
  comment: Comment;
  depth: number;
  maxDepth: number;
}

function CommentItem({ comment, reviewId, postId, complaintId, onCommentAdded, onVoteUpdate, depth, maxDepth }: CommentItemProps) {
  const t = useTranslations();
  const { showToast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(comment.helpfulCount || 0);
  const [localDownVoteCount, setLocalDownVoteCount] = useState(comment.downVoteCount || 0);
  const [localUserVote, setLocalUserVote] = useState<"UP" | "DOWN" | null>(comment.userVote ?? null);
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || []);

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return t("common.time.hoursAgo");
    }
  };

  const handleVote = async (voteType: "UP" | "DOWN") => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const result = await commentsApi.vote(comment.id, voteType);
      if (result.error) {
        showToast(safeApiMessage(result.error), "error");
        return;
      }
      if (result.data) {
        setLocalHelpfulCount(result.data.helpfulCount);
        setLocalDownVoteCount(result.data.downVoteCount);
        setLocalUserVote(result.data.voteType ?? null);
        onVoteUpdate?.(comment.id, result.data.helpfulCount, result.data.downVoteCount);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleReply = async () => {
    setReplyError("");
    const parsed = createCommentSchema.safeParse({ content: replyContent, reviewId, postId, complaintId, parentId: comment.id });
    if (!parsed.success) {
      setReplyError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await commentsApi.create({
        content: parsed.data.content,
        reviewId: parsed.data.reviewId,
        postId: parsed.data.postId,
        complaintId: parsed.data.complaintId,
        parentId: parsed.data.parentId,
      });
      if (result.error) {
        const message = safeApiMessage(result.error);
        setReplyError(message);
        showToast(message, "error");
        return;
      }
      if (result.data) {
        setLocalReplies((prev) => [...prev, result.data!]);
        setReplyContent("");
        setReplyError("");
        setShowReplyForm(false);
        onCommentAdded?.();
      }
    } catch (error) {
      const message = safeApiMessage(error instanceof Error ? error.message : "Something went wrong.");
      setReplyError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-3" style={{ marginLeft: `${depth * 24}px` }}>
      {depth > 0 && <div className="w-[2px] flex-shrink-0 bg-border-light" />}
      <div className="flex-1">
        <div className="flex items-start gap-3">
          <VoteRail
            helpfulCount={localHelpfulCount}
            downVoteCount={localDownVoteCount}
            userVote={localUserVote}
            onVote={handleVote}
            disabled={isVoting}
            variant="comment"
          />

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <div className="avatar avatar-sm">
                {comment.author?.avatar ? (
                  <Image src={comment.author.avatar} alt={comment.author.username} width={32} height={32} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <span className="text-xs font-semibold text-green-text">
                {comment.author?.username || "Anonymous"}
                {comment.author?.verified && <span className="ml-1">✓</span>}
              </span>
              <span className="text-[10px] text-text-quaternary">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            <p className="comment-body-text">{comment.content}</p>
            <div className="mt-2 flex items-center gap-3">
              <button type="button" onClick={() => setShowReplyForm((prev) => !prev)} className="action-btn">
                {t("common.comment.reply")}
              </button>
              <span className="text-xs text-text-quaternary">
                {localReplies.length} {localReplies.length === 1 ? t("common.comment.reply") : t("common.comment.replies")}
              </span>
            </div>

            {showReplyForm && (
              <div className="mt-3 space-y-2">
                <textarea value={replyContent} onChange={(event) => setReplyContent(event.target.value)} placeholder={t("common.comment.writeReply")} className="reply-textarea" rows={3} />
                {replyError && <p className="text-xs text-red-500">{replyError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleReply()} disabled={!replyContent.trim() || isSubmitting} className="reply-btn">
                    {isSubmitting ? t("common.auth.processing") || "Processing..." : t("common.comment.post")}
                  </button>
                  <button type="button" onClick={() => { setShowReplyForm(false); setReplyContent(""); }} className="reply-cancel-btn">
                    {t("common.comment.cancel") || "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {localReplies.length > 0 && depth < maxDepth && (
              <div className="mt-4 space-y-3">
                {localReplies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    reviewId={reviewId}
                    postId={postId}
                    complaintId={complaintId}
                    onCommentAdded={onCommentAdded}
                    onVoteUpdate={onVoteUpdate}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
