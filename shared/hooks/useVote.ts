"use client";

import { useState } from "react";
import type { ApiResponse } from "@/lib/api/core";
import type { VoteResponse, VoteType } from "@/lib/types";

type VoteRequest = (id: string, voteType: VoteType) => Promise<ApiResponse<VoteResponse>>;

interface UseVoteOptions {
  entityId: string;
  initialHelpfulCount?: number;
  initialDownVoteCount?: number;
  initialUserVote?: VoteType | null;
  voteRequest: VoteRequest;
  onSuccess?: (helpfulCount: number, downVoteCount: number, voteType: VoteType | null) => void;
}

export function useVote({
  entityId,
  initialHelpfulCount = 0,
  initialDownVoteCount = 0,
  initialUserVote = null,
  voteRequest,
  onSuccess,
}: UseVoteOptions) {
  const [isVoting, setIsVoting] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [downVoteCount, setDownVoteCount] = useState(initialDownVoteCount);
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);

  const handleVote = async (voteType: VoteType) => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      const response = await voteRequest(entityId, voteType);
      if (response.error || !response.data) return;

      const nextState = response.data;
      setHelpfulCount(nextState.helpfulCount);
      setDownVoteCount(nextState.downVoteCount);
      setUserVote(nextState.voteType);
      onSuccess?.(nextState.helpfulCount, nextState.downVoteCount, nextState.voteType);
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return {
    isVoting,
    helpfulCount,
    downVoteCount,
    userVote,
    isUpVoted: userVote === "UP",
    isDownVoted: userVote === "DOWN",
    handleVote,
  };
}
