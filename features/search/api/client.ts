import type { Review, UserProfile } from "@/lib/types";
import { fetchApi } from "@/lib/api/core";

export const searchApi = {
  search: async (params: { q: string; type?: "all" | "companies" | "reviews" | "users"; limit?: number }) => {
    const query = new URLSearchParams();
    query.set("q", params.q);
    if (params.type) query.set("type", params.type);
    if (params.limit) query.set("limit", params.limit.toString());

    return fetchApi<{
      results: {
        companies?: Array<{ id: string; name: string; slug?: string }>;
        reviews?: Review[];
        users?: UserProfile[];
      };
    }>(`/search?${query.toString()}`);
  },
};
