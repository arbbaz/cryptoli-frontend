import type { NotificationItem } from "@/lib/types";
import { fetchApi } from "@/lib/api/core";

export const notificationsApi = {
  list: async () =>
    fetchApi<{ notifications: NotificationItem[]; unreadCount: number }>("/notifications"),

  registerPushSubscription: async (subscription: PushSubscription) => {
    const sub = subscription.toJSON();
    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return { data: undefined, error: "Invalid subscription" };
    }
    return fetchApi<{ success: boolean }>("/notifications/push-subscription", {
      method: "POST",
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      }),
    });
  },

  markRead: async (id: string) =>
    fetchApi<{ success: boolean; unreadCount: number }>(`/notifications/${id}/read`, {
      method: "POST",
    }),

  markAllRead: async () =>
    fetchApi<{ success: boolean; unreadCount: number }>("/notifications/read-all", {
      method: "POST",
    }),
};
