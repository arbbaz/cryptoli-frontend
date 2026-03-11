import type { UserProfile } from "@/lib/types";
import { fetchApi } from "@/lib/api/core";

export const authApi = {
  register: async (data: { email: string; username: string; password: string; name?: string }) =>
    fetchApi<{ user: UserProfile; message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: async (data: { email: string; password: string }) =>
    fetchApi<{ user: UserProfile; message: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: async () => fetchApi("/auth/logout", { method: "POST" }),

  me: async () => fetchApi<{ user: UserProfile }>("/auth/me"),

  changePassword: async (data: { currentPassword: string; newPassword: string }) =>
    fetchApi<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProfile: async (data: { name?: string; username?: string; bio?: string }) =>
    fetchApi<{ user: UserProfile }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
