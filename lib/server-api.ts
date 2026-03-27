import { cache } from "react";
import { getBackendUrl } from "@/lib/env";
import type { Review, UserProfile, Complaint } from "@/lib/types";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import { PAGE_SIZE } from "@/lib/constants";

const PROFILE_PAGE_SIZE = 10;
const PUBLIC_FEED_REVALIDATE_SECONDS = 300;

function getPublicFetchOptions(hasAuthContext: boolean, tags: string[]) {
  return hasAuthContext
    ? { cache: "no-store" as const }
    : {
        cache: "force-cache" as const,
        next: {
          revalidate: PUBLIC_FEED_REVALIDATE_SECONDS,
          tags,
        },
      };
}

export interface ServerAuthResult {
  isLoggedIn: boolean;
  user: UserProfile | null;
}

export async function getServerAuth(cookieHeader?: string): Promise<ServerAuthResult> {
  const base = getBackendUrl();
  if (!base) return { isLoggedIn: false, user: null };
  try {
    const headers: HeadersInit = {};
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }
    const res = await fetch(`${base}/api/auth/me`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      return { isLoggedIn: false, user: null };
    }
    const data = (await res.json()) as { user?: UserProfile };
    return {
      isLoggedIn: !!data?.user,
      user: data?.user ?? null,
    };
  } catch {
    return { isLoggedIn: false, user: null };
  }
}

export interface ServerReviewsResult {
  reviews: Review[];
  pagination: { page: number; total: number; totalPages: number };
}

export async function getServerReviews(options?: {
  limit?: number;
  page?: number;
  cookieHeader?: string;
}): Promise<ServerReviewsResult> {
  const base = getBackendUrl();
  if (!base) return { reviews: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  const limit = options?.limit ?? PAGE_SIZE;
  const page = options?.page ?? 1;
  const hasAuthContext = hasLikelyAuthCookie(options?.cookieHeader);
  try {
    const url = `${base}/api/reviews?status=APPROVED&limit=${limit}&page=${page}`;
    const headers: HeadersInit = {};
    if (options?.cookieHeader) {
      headers["Cookie"] = options.cookieHeader;
    }
    const res = await fetch(url, {
      headers,
      ...getPublicFetchOptions(hasAuthContext, ["public-reviews-feed"]),
    });
    if (!res.ok) {
      return { reviews: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    }
    const data = (await res.json()) as {
      reviews?: Review[];
      pagination?: { page: number; total: number; totalPages: number };
    };
    return {
      reviews: Array.isArray(data?.reviews) ? data.reviews : [],
      pagination: data?.pagination ?? { page, total: 0, totalPages: 0 },
    };
  } catch {
    return { reviews: [], pagination: { page, total: 0, totalPages: 0 } };
  }
}

export interface UserProfileResponse {
  user: UserProfile & { createdAt?: string };
  stats: { followersCount: number; followingCount: number; postsCount: number; complaintsCount: number };
  viewerState: { isFollowing: boolean };
}

export const getServerUserProfileFull = cache(
  async (
    username: string,
    cookieHeader?: string
  ): Promise<UserProfileResponse | null> => {
    const base = getBackendUrl();
    if (!base) return null;
    try {
      const headers: HeadersInit = {};
      if (cookieHeader) headers["Cookie"] = cookieHeader;
      const res = await fetch(`${base}/api/users/${encodeURIComponent(username)}`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as UserProfileResponse;
      return data?.user ? data : null;
    } catch {
      return null;
    }
  }
);

export async function getServerUserProfile(username: string): Promise<{
  user: (UserProfile & { createdAt?: string }) | null;
}> {
  const data = await getServerUserProfileFull(username);
  return { user: data?.user ?? null };
}

export interface ServerProfileReviewsResult {
  reviews: Review[];
  pagination: { page: number; total: number; totalPages: number };
}

export async function getServerProfileReviews(
  username: string,
  options?: { page?: number; limit?: number; cookieHeader?: string }
): Promise<ServerProfileReviewsResult> {
  const base = getBackendUrl();
  if (!base) return { reviews: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  const page = options?.page ?? 1;
  const limit = options?.limit ?? PROFILE_PAGE_SIZE;
  const hasAuthContext = hasLikelyAuthCookie(options?.cookieHeader);
  try {
    const url = `${base}/api/reviews?username=${encodeURIComponent(username)}&page=${page}&limit=${limit}`;
    const headers: HeadersInit = {};
    if (options?.cookieHeader) headers["Cookie"] = options.cookieHeader;
    const res = await fetch(url, {
      headers,
      ...getPublicFetchOptions(hasAuthContext, [`profile-reviews:${username}`]),
    });
    if (!res.ok) return { reviews: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    const data = (await res.json()) as {
      reviews?: Review[];
      pagination?: { page: number; total: number; totalPages: number };
    };
    const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
    const pagination = data?.pagination ?? { page: 1, total: 0, totalPages: 0 };
    return { reviews, pagination };
  } catch {
    return { reviews: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  }
}

export interface ServerProfileComplaintsResult {
  complaints: Complaint[];
  pagination: { page: number; total: number; totalPages: number };
}

export async function getServerProfileComplaints(
  username: string,
  options?: { page?: number; limit?: number; cookieHeader?: string }
): Promise<ServerProfileComplaintsResult> {
  const base = getBackendUrl();
  if (!base) return { complaints: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  const page = options?.page ?? 1;
  const limit = options?.limit ?? PROFILE_PAGE_SIZE;
  const hasAuthContext = hasLikelyAuthCookie(options?.cookieHeader);
  try {
    const url = `${base}/api/complaints?username=${encodeURIComponent(username)}&page=${page}&limit=${limit}`;
    const headers: HeadersInit = {};
    if (options?.cookieHeader) headers["Cookie"] = options.cookieHeader;
    const res = await fetch(url, {
      headers,
      ...getPublicFetchOptions(hasAuthContext, [`profile-complaints:${username}`]),
    });
    if (!res.ok) return { complaints: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    const data = (await res.json()) as {
      complaints?: Complaint[];
      pagination?: { page: number; total: number; totalPages: number };
    };
    const complaints = Array.isArray(data?.complaints) ? data.complaints : [];
    const pagination = data?.pagination ?? { page: 1, total: 0, totalPages: 0 };
    return { complaints, pagination };
  } catch {
    return { complaints: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  }
}

export interface ServerComplaintsResult {
  complaints: Complaint[];
  pagination: { page: number; total: number; totalPages: number };
}

export async function getServerComplaints(options?: {
  limit?: number;
  page?: number;
  cookieHeader?: string;
}): Promise<ServerComplaintsResult> {
  const base = getBackendUrl();
  if (!base) return { complaints: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  const limit = options?.limit ?? PAGE_SIZE;
  const page = options?.page ?? 1;
  const hasAuthContext = hasLikelyAuthCookie(options?.cookieHeader);
  try {
    const url = `${base}/api/complaints?limit=${limit}&page=${page}`;
    const headers: HeadersInit = {};
    if (options?.cookieHeader) {
      headers["Cookie"] = options.cookieHeader;
    }
    const res = await fetch(url, {
      headers,
      ...getPublicFetchOptions(hasAuthContext, ["public-complaints-feed"]),
    });
    if (!res.ok) {
      return { complaints: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    }
    const data = (await res.json()) as {
      complaints?: Complaint[];
      pagination?: { page: number; total: number; totalPages: number };
    };
    return {
      complaints: Array.isArray(data?.complaints) ? data.complaints : [],
      pagination: data?.pagination ?? { page, total: 0, totalPages: 0 },
    };
  } catch {
    return { complaints: [], pagination: { page, total: 0, totalPages: 0 } };
  }
}
