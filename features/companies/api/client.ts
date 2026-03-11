import type { PaginatedData } from "@/lib/api/core";
import { fetchApi } from "@/lib/api/core";

export const companiesApi = {
  list: async (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);

    return fetchApi<{
      companies: Array<{ id: string; name: string; slug?: string; logo?: string; category?: string }>;
      pagination: PaginatedData<unknown>["pagination"];
    }>(`/companies?${query.toString()}`);
  },

  getBySlug: async (slug: string) =>
    fetchApi<{ id: string; name: string; slug?: string; logo?: string; category?: string; description?: string }>(
      `/companies/${slug}`,
    ),
};
