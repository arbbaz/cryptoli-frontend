import type { UserProfile } from "@/lib/types";
import { fetchApi } from "@/lib/api/core";
import type { Author } from "@/lib/types";

export interface UserProfileStats {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  complaintsCount: number;
}

export interface UserProfileResponse {
  user: UserProfile & { createdAt?: string };
  stats: UserProfileStats;
  viewerState: {
    isFollowing: boolean;
  };
}

export const usersApi = {
  getProfile: async (username: string) =>
    fetchApi<UserProfileResponse>(`/users/${encodeURIComponent(username)}`),

  follow: async (username: string) =>
    fetchApi<{ following: boolean }>(
      `/users/${encodeURIComponent(username)}/follow`,
      { method: "POST" },
    ),

  unfollow: async (username: string) =>
    fetchApi<{ following: boolean }>(
      `/users/${encodeURIComponent(username)}/follow`,
      { method: "DELETE" },
    ),

  followers: async (username: string) =>
    fetchApi<{ users: Author[] }>(
      `/users/${encodeURIComponent(username)}/followers`,
    ),

  following: async (username: string) =>
    fetchApi<{ users: Author[] }>(
      `/users/${encodeURIComponent(username)}/following`,
    ),

  getFollowStatus: async (username: string) =>
    fetchApi<{ following: boolean }>(
      `/users/${encodeURIComponent(username)}/follow-status`,
    ),

  getFollowStatusBulk: async (usernames: string[]) =>
    fetchApi<{ following: Record<string, boolean> }>(
      `/users/follow-status-bulk?usernames=${usernames.map((u) => encodeURIComponent(u)).join(",")}`,
    ),
};

