import type { Complaint, VoteResponse } from "@/lib/types";
import type { PaginatedData } from "@/lib/api/core";
import { fetchApi } from "@/lib/api/core";

export const complaintsApi = {
  list: async (params?: { page?: number; limit?: number; companyId?: string; userId?: string; username?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.companyId) query.set("companyId", params.companyId);
    if (params?.userId) query.set("userId", params.userId);
    if (params?.username) query.set("username", params.username);

    return fetchApi<{ complaints: Complaint[]; pagination: PaginatedData<Complaint>["pagination"] }>(`/complaints?${query.toString()}`);
  },

  get: async (id: string) => fetchApi<Complaint>(`/complaints/${id}`),

  create: async (data: { title: string; content: string; companyId?: string; productId?: string }) =>
    fetchApi<Complaint>("/complaints", { method: "POST", body: JSON.stringify(data) }),

  vote: async (id: string, voteType: "UP" | "DOWN") =>
    fetchApi<VoteResponse>(`/complaints/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType }),
    }),

  reply: async (id: string, content: string) =>
    fetchApi<{ id: string; content: string; createdAt: string }>(`/complaints/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
