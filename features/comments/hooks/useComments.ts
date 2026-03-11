"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/contexts/ToastContext";
import { safeApiMessage } from "@/lib/apiErrors";
import { useSocket } from "@/lib/socket";
import { createCommentSchema } from "@/lib/validations";
import { commentsApi } from "@/features/comments/api/client";
import type { Comment } from "@/lib/types";

type CommentTargetKey = "reviewId" | "complaintId" | "postId";

interface UseCommentsOptions {
  targetKey: CommentTargetKey;
  targetId: string;
  initialCount?: number;
}

export function useComments({ targetKey, targetId, initialCount = 0 }: UseCommentsOptions) {
  const { showToast } = useToast();
  const { socket } = useSocket();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCount);

  useEffect(() => {
    if (targetKey !== "reviewId" || !socket) return;
    const handleCount = (payload: { reviewId: string; commentCount: number }) => {
      if (payload.reviewId === targetId) {
        setCommentCount(payload.commentCount);
      }
    };
    socket.on("review:comment:count", handleCount);
    return () => {
      socket.off("review:comment:count", handleCount);
    };
  }, [targetKey, targetId, socket]);

  const buildCommentFilter = () => ({ [targetKey]: targetId });

  const fetchComments = async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && comments.length > 0) return;
    setLoadingComments(true);
    try {
      const response = await commentsApi.list(buildCommentFilter());
      if (response.data?.comments) {
        setComments(response.data.comments);
      } else if (response.error) {
        showToast(safeApiMessage(response.error), "error");
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      void fetchComments();
    }
    setShowComments((prev) => !prev);
  };

  const submitComment = async () => {
    const filter = buildCommentFilter();
    const parsed = createCommentSchema.safeParse({ content: commentContent, ...filter });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? "Validation failed", "error");
      return;
    }
    if (!commentContent.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await commentsApi.create({ content: parsed.data.content, ...filter });
      if (response.error) {
        showToast(safeApiMessage(response.error), "error");
        return;
      }
      if (response.data) {
        setComments((prev) => [response.data!, ...prev]);
        setCommentContent("");
        setCommentCount((prev) => prev + 1);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      showToast(safeApiMessage(msg), "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return {
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
  };
}
