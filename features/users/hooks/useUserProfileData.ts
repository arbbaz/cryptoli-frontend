"use client";

import { useCallback, useEffect, useState } from "react";
import { authApi } from "@/features/auth/api/client";
import { complaintsApi } from "@/features/complaints/api/client";
import { reviewsApi } from "@/features/reviews/api/client";
import { useToast } from "@/lib/contexts/ToastContext";
import type { Complaint, Review, UserProfile } from "@/lib/types";

function isAuthFailureMessage(message: string): boolean {
  return /unauthorized|authentication required/i.test(message);
}

export function useUserProfileData(username: string) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUserProfile = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    try {
      const reviewsResponse = await reviewsApi.list({ limit: 50 });
      const complaintsResponse = await complaintsApi.list({ username, limit: 50 });

      if (reviewsResponse.error) {
        showToast(reviewsResponse.error, "error");
      }
      if (complaintsResponse.error) {
        showToast(complaintsResponse.error, "error");
      }

      const allReviews = reviewsResponse.data?.reviews ?? [];
      const userReviews = allReviews.filter((review) => review.author?.username === username);
      const userComplaints = complaintsResponse.data?.complaints ?? [];

      setReviews(userReviews);
      setComplaints(userComplaints);

      const nextUser = userReviews[0]?.author ?? userComplaints[0]?.author ?? null;
      setUser(nextUser ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profile.";
      console.error("Error fetching user profile:", error);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [username, showToast]);

  useEffect(() => {
    void authApi.me().then((response) => {
      setIsLoggedIn(Boolean(response.data?.user));
      if (response.error && !isAuthFailureMessage(response.error)) {
        showToast(response.error, "error");
      }
    });
  }, [showToast]);

  useEffect(() => {
    void fetchUserProfile();
  }, [fetchUserProfile]);

  const updateReviewVote = (reviewId: string, helpfulCount: number, downVoteCount: number) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              helpfulCount,
              downVoteCount,
              _count: {
                ...review._count,
                helpfulVotes: helpfulCount,
              },
            }
          : review
      )
    );
  };

  const updateComplaintVote = (complaintId: string, helpfulCount: number, downVoteCount: number) => {
    setComplaints((prevComplaints) =>
      prevComplaints.map((complaint) =>
        complaint.id === complaintId
          ? { ...complaint, helpfulCount, downVoteCount }
          : complaint
      )
    );
  };

  return {
    isLoggedIn,
    user,
    reviews,
    complaints,
    loading,
    fetchUserProfile,
    updateReviewVote,
    updateComplaintVote,
  };
}
