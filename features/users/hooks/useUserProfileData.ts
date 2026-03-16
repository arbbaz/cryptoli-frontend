"use client";

import { useCallback, useEffect, useState } from "react";
import { authApi } from "@/features/auth/api/client";
import { complaintsApi } from "@/features/complaints/api/client";
import { reviewsApi } from "@/features/reviews/api/client";
import { usersApi } from "@/features/users/api/client";
import { useToast } from "@/lib/contexts/ToastContext";
import type { Complaint, Review, UserProfile } from "@/lib/types";

function isAuthFailureMessage(message: string): boolean {
  return /unauthorized|authentication required/i.test(message);
}

export function useUserProfileData(username: string) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<{
    followersCount: number;
    followingCount: number;
    postsCount: number;
    complaintsCount: number;
  } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUserProfile = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    try {
      const profileResponse = await usersApi.getProfile(username);
      const reviewsResponse = await reviewsApi.list({ limit: 50 });
      const complaintsResponse = await complaintsApi.list({ username, limit: 50 });

      if (profileResponse.error) {
        showToast(profileResponse.error, "error");
      }
      if (reviewsResponse.error) {
        showToast(reviewsResponse.error, "error");
      }
      if (complaintsResponse.error) {
        showToast(complaintsResponse.error, "error");
      }

      const profileData = profileResponse.data;
      if (profileData) {
        setUser(profileData.user);
        setStats(profileData.stats);
        setIsFollowing(profileData.viewerState.isFollowing);
      } else {
        setUser(null);
        setStats(null);
        setIsFollowing(false);
      }

      const allReviews = reviewsResponse.data?.reviews ?? [];
      const userReviews = allReviews.filter((review) => review.author?.username === username);
      const userComplaints = complaintsResponse.data?.complaints ?? [];

      setReviews(userReviews);
      setComplaints(userComplaints);
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

  const toggleFollow = useCallback(async () => {
    if (!user) return;
    try {
      if (isFollowing) {
        const response = await usersApi.unfollow(user.username);
        if (!response.error) {
          setIsFollowing(false);
          setStats((prev) =>
            prev
              ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) }
              : prev,
          );
        } else {
          showToast(response.error, "error");
        }
      } else {
        const response = await usersApi.follow(user.username);
        if (!response.error) {
          setIsFollowing(true);
          setStats((prev) =>
            prev ? { ...prev, followersCount: prev.followersCount + 1 } : prev,
          );
        } else {
          showToast(response.error, "error");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update follow status.";
      showToast(message, "error");
    }
  }, [user, isFollowing, showToast]);

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
    stats,
    isFollowing,
    reviews,
    complaints,
    loading,
    fetchUserProfile,
    toggleFollow,
    updateReviewVote,
    updateComplaintVote,
  };
}
