"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import ComplaintListCard from "@/features/complaints/components/ComplaintListCard";
import { usersApi } from "@/features/users/api/client";
import { useUserProfileData } from "@/features/users/hooks/useUserProfileData";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { Author } from "@/lib/types";

interface UserProfilePageClientProps {
  username: string;
}

export default function UserProfilePageClient({ username }: UserProfilePageClientProps) {
  const { isLoggedIn, user: currentUser } = useAuth();
  const { user, stats, isFollowing, reviews, complaints, loading, toggleFollow } =
    useUserProfileData(username);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  const [activeTab, setActiveTab] = useState<"reviews" | "complaints" | "followers" | "following">(
    "reviews",
  );
  const [followers, setFollowers] = useState<Author[]>([]);
  const [following, setFollowing] = useState<Author[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [followStatusByUsername, setFollowStatusByUsername] = useState<Record<string, boolean>>({});
  const [followHoverUnfollow, setFollowHoverUnfollow] = useState(false);

  useEffect(() => {
    if (!username || (activeTab !== "followers" && activeTab !== "following")) return;
    let cancelled = false;
    setLoadingRelations(true);
    if (activeTab === "followers") {
      usersApi.followers(username).then((res) => {
        if (!cancelled && !res.error && res.data) setFollowers(res.data.users);
        setLoadingRelations(false);
      });
    } else {
      usersApi.following(username).then((res) => {
        if (!cancelled && !res.error && res.data) setFollowing(res.data.users);
        setLoadingRelations(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [activeTab, username]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const list = activeTab === "followers" ? followers : activeTab === "following" ? following : [];
    const usernames = list.map((u) => u.username).filter(Boolean);
    if (usernames.length === 0) return;
    usersApi.getFollowStatusBulk(usernames).then((res) => {
      if (!res.error && res.data) setFollowStatusByUsername(res.data.following);
    });
  }, [activeTab, isLoggedIn, followers, following]);

  const formatJoined = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return null;
    }
  };

  const handleFollowRow = async (targetUsername: string, currentlyFollowing: boolean) => {
    if (currentlyFollowing) {
      const res = await usersApi.unfollow(targetUsername);
      if (!res.error) setFollowStatusByUsername((prev) => ({ ...prev, [targetUsername]: false }));
    } else {
      const res = await usersApi.follow(targetUsername);
      if (!res.error) setFollowStatusByUsername((prev) => ({ ...prev, [targetUsername]: true }));
    }
  };

  if (!loading && !user) {
    router.push("/");
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:pt-12 lg:pt-16 animate-pulse">
        <div className="card-base">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-[#E5E5E5]" />
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-[#E5E5E5]" />
                <div className="h-4 w-48 rounded bg-[#E5E5E5]" />
              </div>
            </div>
            <div className="h-9 w-24 rounded-full bg-[#E5E5E5]" />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="h-4 w-20 rounded bg-[#E5E5E5]" />
            <div className="h-4 w-16 rounded bg-[#E5E5E5]" />
            <div className="h-4 w-14 rounded bg-[#E5E5E5]" />
            <div className="h-4 w-20 rounded bg-[#E5E5E5]" />
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-4 flex gap-1 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-1">
            <div className="h-9 flex-1 rounded-lg bg-[#E5E5E5]" />
            <div className="h-9 flex-1 rounded-lg bg-[#E5E5E5]" />
            <div className="h-9 flex-1 rounded-lg bg-[#E5E5E5]" />
            <div className="h-9 flex-1 rounded-lg bg-[#E5E5E5]" />
          </div>
          <div className="space-y-4">
            <div className="card-base h-24 rounded-lg bg-[#F5F5F5]" />
            <div className="card-base h-32 rounded-lg bg-[#F5F5F5]" />
            <div className="card-base h-28 rounded-lg bg-[#F5F5F5]" />
          </div>
        </div>
      </div>
    );
  }

  const profileUser = user as (typeof user) & { createdAt?: string };
  const joinedStr = formatJoined(profileUser?.createdAt);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:pt-12 lg:pt-16">
      <div className="card-base">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold uppercase text-primary ring-2 ring-primary/20">
              {user?.username?.slice(0, 2) ?? "US"}
            </div>
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-text-primary">
                @{user?.username}
                {user?.verified && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    ✓ Verified
                  </span>
                )}
              </h1>
              {user?.bio && <p className="mt-1 text-sm text-text-secondary">{user.bio}</p>}
              {joinedStr && (
                <p className="mt-1 text-xs text-text-secondary">Joined {joinedStr}</p>
              )}
            </div>
          </div>

          {isLoggedIn && user && (
            <button
              type="button"
              onClick={() => void toggleFollow()}
              onMouseEnter={() => setFollowHoverUnfollow(true)}
              onMouseLeave={() => setFollowHoverUnfollow(false)}
              className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
                isFollowing
                  ? "border border-primary bg-white text-primary hover:border-alert-red hover:bg-alert-red/5 hover:text-alert-red"
                  : "btn-primary"
              }`}
            >
              {isFollowing ? (followHoverUnfollow ? "Unfollow" : "Following") : "Follow"}
            </button>
          )}
        </div>

        {stats && (
          <>
            <div className="mt-4 border-t border-[#E5E5E5] pt-4">
              <div className="flex flex-wrap items-center gap-6 text-xs text-text-secondary">
                <button
                  type="button"
                  onClick={() => setActiveTab("followers")}
                  className="hover:text-primary transition-colors"
                >
                  <span className="font-semibold text-text-primary">{stats.followersCount}</span>{" "}
                  Followers
                </button>
                <span className="text-[#E5E5E5]">|</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("following")}
                  className="hover:text-primary transition-colors"
                >
                  <span className="font-semibold text-text-primary">{stats.followingCount}</span>{" "}
                  Following
                </button>
                <span className="text-[#E5E5E5]">|</span>
                <span>
                  <span className="font-semibold text-text-primary">{stats.postsCount}</span> Posts
                </span>
                <span className="text-[#E5E5E5]">|</span>
                <span>
                  <span className="font-semibold text-text-primary">{stats.complaintsCount}</span>{" "}
                  Complaints
                </span>
                {typeof (user as { reputation?: number })?.reputation === "number" && (
                  <>
                    <span className="text-[#E5E5E5]">|</span>
                    <span>
                      <span className="font-semibold text-text-primary">
                        {(user as { reputation: number }).reputation}
                      </span>{" "}
                      Reputation
                    </span>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6">
        {/* Tabs */}
        <div
          className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] p-1"
          role="tablist"
          aria-label="Profile sections"
        >
          {[
            { id: "reviews", label: "Reviews", count: reviews.length },
            { id: "complaints", label: "Complaints", count: complaints.length },
            {
              id: "followers",
              label: "Followers",
              count: stats?.followersCount ?? 0,
            },
            {
              id: "following",
              label: "Following",
              count: stats?.followingCount ?? 0,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`min-w-[80px] flex-shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          className="space-y-4"
          role="tabpanel"
          id="panel-reviews"
          aria-labelledby="tab-reviews"
          aria-hidden={activeTab !== "reviews"}
          hidden={activeTab !== "reviews"}
        >
          {activeTab === "reviews" &&
            (reviews.length > 0 ? (
              reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="card-base py-8 text-center text-sm text-text-secondary">
                <p className="font-medium text-text-primary">No reviews yet</p>
                <p className="mt-1">Reviews from @{username} will show here.</p>
              </div>
            ))}
        </div>

        <div
          className="space-y-4"
          role="tabpanel"
          id="panel-complaints"
          aria-labelledby="tab-complaints"
          aria-hidden={activeTab !== "complaints"}
          hidden={activeTab !== "complaints"}
        >
          {activeTab === "complaints" &&
            (complaints.length > 0 ? (
              complaints.map((complaint, index) => (
                <ComplaintListCard key={complaint.id} complaint={complaint} index={index} />
              ))
            ) : (
              <div className="card-base py-8 text-center text-sm text-text-secondary">
                <p className="font-medium text-text-primary">No complaints yet</p>
                <p className="mt-1">Complaints from @{username} will show here.</p>
              </div>
            ))}
        </div>

        <div
          className="space-y-4"
          role="tabpanel"
          id="panel-followers"
          aria-labelledby="tab-followers"
          aria-hidden={activeTab !== "followers"}
          hidden={activeTab !== "followers"}
        >
          {activeTab === "followers" &&
            (loadingRelations ? (
              <div className="card-base py-6 text-center text-sm text-text-secondary">
                Loading followers…
              </div>
            ) : followers.length > 0 ? (
              <div className="card-base divide-y divide-[#E5E5E5]">
                {followers.map((follower) => {
                  const isFollowingRow = followStatusByUsername[follower.username] ?? false;
                  return (
                    <div
                      key={follower.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <Link
                        href={`/${locale}/users/${encodeURIComponent(follower.username)}`}
                        className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-90"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                          {follower.username?.slice(0, 2) ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary">
                            @{follower.username}
                          </p>
                          {follower.bio && (
                            <p className="truncate text-xs text-text-secondary">{follower.bio}</p>
                          )}
                        </div>
                      </Link>
                      {isLoggedIn && follower.username !== currentUser?.username && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            void handleFollowRow(follower.username, isFollowingRow);
                          }}
                          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                            isFollowingRow
                              ? "border border-[#E5E5E5] bg-white text-text-secondary hover:border-primary hover:text-primary"
                              : "btn-primary"
                          }`}
                        >
                          {isFollowingRow ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-base py-8 text-center text-sm text-text-secondary">
                <p className="font-medium text-text-primary">No followers yet</p>
                <p className="mt-1">When someone follows @{username}, they&apos;ll appear here.</p>
              </div>
            ))}
        </div>

        <div
          className="space-y-4"
          role="tabpanel"
          id="panel-following"
          aria-labelledby="tab-following"
          aria-hidden={activeTab !== "following"}
          hidden={activeTab !== "following"}
        >
          {activeTab === "following" &&
            (loadingRelations ? (
              <div className="card-base py-6 text-center text-sm text-text-secondary">
                Loading following…
              </div>
            ) : following.length > 0 ? (
              <div className="card-base divide-y divide-[#E5E5E5]">
                {following.map((u) => {
                  const isFollowingRow = followStatusByUsername[u.username] ?? false;
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <Link
                        href={`/${locale}/users/${encodeURIComponent(u.username)}`}
                        className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-90"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                          {u.username?.slice(0, 2) ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary">@{u.username}</p>
                          {u.bio && (
                            <p className="truncate text-xs text-text-secondary">{u.bio}</p>
                          )}
                        </div>
                      </Link>
                      {isLoggedIn && u.username !== currentUser?.username && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            void handleFollowRow(u.username, isFollowingRow);
                          }}
                          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                            isFollowingRow
                              ? "border border-[#E5E5E5] bg-white text-text-secondary hover:border-primary hover:text-primary"
                              : "btn-primary"
                          }`}
                        >
                          {isFollowingRow ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-base py-8 text-center text-sm text-text-secondary">
                <p className="font-medium text-text-primary">Not following anyone yet</p>
                <p className="mt-1">When @{username} follows people, they&apos;ll appear here.</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

