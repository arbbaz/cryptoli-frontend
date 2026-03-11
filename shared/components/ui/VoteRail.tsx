"use client";

import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import type { VoteType } from "@/lib/types";

function getVoteButtonClass(isActive: boolean, isVoting: boolean): string {
  return `vote-btn ${isActive ? "vote-btn-active" : "vote-btn-idle"} ${isVoting ? "vote-btn-waiting" : "vote-btn-ready"}`;
}

export interface VoteRailProps {
  helpfulCount: number;
  downVoteCount: number;
  userVote: VoteType | null;
  onVote: (voteType: VoteType) => void;
  disabled?: boolean;
  /** "card" = review card (larger); "comment" = comment item (smaller) */
  variant?: "card" | "comment";
}

const variantClasses = {
  card: {
    rail: "vote-rail",
    count: "vote-count",
    countDown: "vote-count-down",
    iconSize: 20,
  },
  comment: {
    rail: "comment-item-vote-rail",
    count: "comment-item-vote-count",
    countDown: "comment-item-vote-count-down",
    iconSize: 16,
  },
} as const;

export default function VoteRail({
  helpfulCount,
  downVoteCount,
  userVote,
  onVote,
  disabled = false,
  variant = "card",
}: VoteRailProps) {
  const classes = variantClasses[variant];
  const size = classes.iconSize;

  return (
    <div className={classes.rail}>
      <button
        type="button"
        onClick={() => onVote("UP")}
        disabled={disabled}
        className={getVoteButtonClass(userVote === "UP", disabled)}
        aria-label="Vote up"
      >
        <IoMdArrowUp color="#00885E" size={size} className={userVote === "UP" ? "drop-shadow-md" : ""} />
      </button>
      <span className={classes.count}>{helpfulCount}</span>
      <button
        type="button"
        onClick={() => onVote("DOWN")}
        disabled={disabled}
        className={getVoteButtonClass(userVote === "DOWN", disabled)}
        aria-label="Vote down"
      >
        <IoMdArrowDown color="#EA580C" size={size} className={userVote === "DOWN" ? "drop-shadow-md" : ""} />
      </button>
      <span className={classes.countDown}>{downVoteCount}</span>
    </div>
  );
}
