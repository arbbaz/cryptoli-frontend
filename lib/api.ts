import type {
  Comment,
  Complaint,
  NotificationItem,
  Review,
  UserProfile,
  VoteResponse,
} from "./types";
import { getApiBaseUrl } from "./env";
import { safeApiMessage } from "./apiErrors";

const API_BASE = getApiBaseUrl() ? `${getApiBaseUrl()}/api` : "/api";

// Auth is cookie-based; intentionally no-op to avoid token persistence in browser storage.
export function setApiAuthToken(token?: string): void {
  void token;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginatedData<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: unknown;
  items?: T[];
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const headers = new Headers(options?.headers);
    if (options?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include', // Include cookies for session management
      headers,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJsonResponse = contentType.includes('application/json');
    let data: unknown = null;

    if (response.status !== 204) {
      if (isJsonResponse) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        const text = await response.text();
        data = text || null;
      }
    }

    if (!response.ok) {
      const fallback = 'An error occurred';
      const dataRecord = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
      const messageSource = dataRecord?.message;
      const message =
        Array.isArray(messageSource)
          ? messageSource.map((part) => String(part)).join(', ')
          : typeof messageSource === 'string'
            ? messageSource
            : typeof data === 'string' && data.trim()
              ? data.trim()
              : undefined;
      const errorLabel =
        typeof dataRecord?.error === 'string' ? dataRecord.error.trim() : undefined;
      const genericLabels = new Set(['Error', 'Bad Request', 'Unauthorized', 'Forbidden', 'Conflict']);
      const rawError =
        message ||
        (errorLabel && !genericLabels.has(errorLabel) ? errorLabel : undefined) ||
        (response.statusText ? `${response.status} ${response.statusText}` : undefined) ||
        fallback;
      return { error: safeApiMessage(rawError) };
    }

    return { data: data as T };
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Network error';
    return { error: safeApiMessage(raw) };
  }
}

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    name?: string;
  }) => {
    return fetchApi<{ user: UserProfile; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    return fetchApi<{ user: UserProfile; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },

  me: async () => {
    return fetchApi<{ user: UserProfile }>('/auth/me');
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    return fetchApi<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProfile: async (data: {
    name?: string;
    username?: string;
    bio?: string;
  }) => {
    return fetchApi<{ user: UserProfile }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export const notificationsApi = {
  list: async () => {
    return fetchApi<{
      notifications: NotificationItem[];
      unreadCount: number;
    }>('/notifications');
  },

  registerPushSubscription: async (subscription: PushSubscription) => {
    const sub = subscription.toJSON();
    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return { data: undefined, error: 'Invalid subscription' };
    }
    return fetchApi<{ success: boolean }>('/notifications/push-subscription', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      }),
    });
  },

  markRead: async (id: string) => {
    return fetchApi<{ success: boolean; unreadCount: number }>(
      `/notifications/${id}/read`,
      {
        method: 'POST',
      },
    );
  },

  markAllRead: async () => {
    return fetchApi<{ success: boolean; unreadCount: number }>(
      '/notifications/read-all',
      {
        method: 'POST',
      },
    );
  },
};

// Companies API
export const companiesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    return fetchApi<{
      companies: Array<{
        id: string;
        name: string;
        slug?: string;
        logo?: string;
        category?: string;
      }>;
      pagination: PaginatedData<unknown>["pagination"];
    }>(`/companies?${query.toString()}`);
  },

  getBySlug: async (slug: string) => {
    return fetchApi<{
      id: string;
      name: string;
      slug?: string;
      logo?: string;
      category?: string;
      description?: string;
    }>(`/companies/${slug}`);
  },
};

// Reviews API
export const reviewsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    companyId?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.companyId) query.set('companyId', params.companyId);
    if (params?.status) query.set('status', params.status);

    return fetchApi<{
      reviews: Review[];
      pagination: PaginatedData<Review>["pagination"];
    }>(`/reviews?${query.toString()}`);
  },

  get: async (id: string) => {
    return fetchApi<Review>(`/reviews/${id}`);
  },

  create: async (data: {
    title: string;
    content: string;
    companyId?: string;
    productId?: string;
    overallScore: number;
    criteriaScores: Record<string, number>;
  }) => {
    return fetchApi<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  toggleHelpful: async (id: string) => {
    return fetchApi<{ helpful: boolean }>(`/reviews/${id}/helpful`, {
      method: 'POST',
    });
  },

  vote: async (id: string, voteType: 'UP' | 'DOWN') => {
    return fetchApi<VoteResponse>(`/reviews/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
  },
};

// Feed API
export const feedApi = {
  get: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);

    return fetchApi<{
      items: Array<Review | Complaint>;
      pagination: PaginatedData<Review | Complaint>["pagination"];
    }>(`/feed?${query.toString()}`);
  },
};

// Search API
export const searchApi = {
  search: async (params: {
    q: string;
    type?: 'all' | 'companies' | 'reviews' | 'users';
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    query.set('q', params.q);
    if (params.type) query.set('type', params.type);
    if (params.limit) query.set('limit', params.limit.toString());

    return fetchApi<{
      results: {
        companies?: Array<{ id: string; name: string; slug?: string }>;
        reviews?: Review[];
        users?: UserProfile[];
      };
    }>(`/search?${query.toString()}`);
  },
};

// Trending API
export const trendingApi = {
  get: async (params?: {
    period?: 'week' | 'month';
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.period) query.set('period', params.period);
    if (params?.limit) query.set('limit', params.limit.toString());

    return fetchApi<{
      trendingNow: Array<{
        id: string;
        name: string;
        description: string;
        likes: number;
        averageScore: number;
        reviewCount: number;
      }>;
      topRatedThisWeek: Array<{
        id: string;
        name: string;
        description: string;
        likes: number;
        averageScore: number;
        reviewCount: number;
      }>;
    }>(`/trending?${query.toString()}`);
  },
};

// Complaints API
export const complaintsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    companyId?: string;
    userId?: string;
    username?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.companyId) query.set('companyId', params.companyId);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.username) query.set('username', params.username);

    return fetchApi<{
      complaints: Complaint[];
      pagination: PaginatedData<Complaint>["pagination"];
    }>(`/complaints?${query.toString()}`);
  },

  get: async (id: string) => {
    return fetchApi<Complaint>(`/complaints/${id}`);
  },

  create: async (data: {
    title: string;
    content: string;
    companyId?: string;
    productId?: string;
  }) => {
    return fetchApi<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  vote: async (id: string, voteType: 'UP' | 'DOWN') => {
    return fetchApi<VoteResponse>(`/complaints/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
  },

  reply: async (id: string, content: string) => {
    return fetchApi<{ id: string; content: string; createdAt: string }>(`/complaints/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

// Comments API
export const commentsApi = {
  list: async (params: {
    reviewId?: string;
    postId?: string;
    complaintId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.reviewId) query.set('reviewId', params.reviewId);
    if (params.postId) query.set('postId', params.postId);
    if (params.complaintId) query.set('complaintId', params.complaintId);

    return fetchApi<{
      comments: Comment[];
    }>(`/comments/list?${query.toString()}`);
  },

  create: async (data: {
    content: string;
    reviewId?: string;
    postId?: string;
    complaintId?: string;
    parentId?: string;
  }) => {
    return fetchApi<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  vote: async (id: string, voteType: 'UP' | 'DOWN') => {
    return fetchApi<VoteResponse>(`/comments/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
  },
};
