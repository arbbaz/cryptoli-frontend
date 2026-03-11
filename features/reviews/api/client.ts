import type { Review, VoteResponse } from "@/lib/types";
import type { PaginatedData } from "@/lib/api/core";
import { fetchApi } from "@/lib/api/core";

export const reviewsApi = {
  list: async (params?: { page?: number; limit?: number; category?: string; companyId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.category) query.set("category", params.category);
    if (params?.companyId) query.set("companyId", params.companyId);
    if (params?.status) query.set("status", params.status);

    return fetchApi<{ reviews: Review[]; pagination: PaginatedData<Review>["pagination"] }>(`/reviews?${query.toString()}`);
  },

  get: async (id: string) => fetchApi<Review>(`/reviews/${id}`),

  create: async (data: {
    title: string;
    content: string;
    companyId?: string;
    productId?: string;
    overallScore: number;
    criteriaScores: Record<string, number>;
  }) =>
    fetchApi<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  toggleHelpful: async (id: string) =>
    fetchApi<{ helpful: boolean }>(`/reviews/${id}/helpful`, { method: "POST" }),

  vote: async (id: string, voteType: "UP" | "DOWN") =>
    fetchApi<VoteResponse>(`/reviews/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType }),
    }),
};
