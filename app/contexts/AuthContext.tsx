"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { authApi } from "@/lib/api";
import { useToast } from "@/app/contexts/ToastContext";
import type { UserProfile } from "@/lib/types";

function isAuthFailureMessage(message: string): boolean {
  return /unauthorized|authentication required/i.test(message);
}

// Map NextAuth session.user to UserProfile (session is source of truth when authenticated)
function sessionUserToProfile(sessionUser: {
  id?: string;
  email?: string | null;
  name?: string | null;
  username?: string;
  avatar?: string | null;
  verified?: boolean;
  reputation?: number;
  bio?: string | null;
}): UserProfile | null {
  if (!sessionUser?.id || !sessionUser?.username) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? undefined,
    username: sessionUser.username,
    name: sessionUser.name ?? undefined,
    avatar: sessionUser.avatar ?? undefined,
    verified: sessionUser.verified ?? false,
    bio: sessionUser.bio ?? undefined,
    reputation: sessionUser.reputation ?? 0,
  };
}

interface AuthContextValue {
  isLoggedIn: boolean;
  user: UserProfile | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface InitialAuth {
  isLoggedIn: boolean;
  user: UserProfile | null;
}

export function AuthProvider({
  children,
  initialAuth,
}: {
  children: React.ReactNode;
  initialAuth?: InitialAuth | null;
}) {
  const { data: session, status } = useSession();
  const [fallbackAuth, setFallbackAuth] = useState<InitialAuth | null>(initialAuth ?? null);
  const { showToast } = useToast();

  const refreshAuth = useCallback(async () => {
    const response = await authApi.me();
    setFallbackAuth({
      isLoggedIn: !!response.data?.user,
      user: response.data?.user ?? null,
    });
    if (response.error && !isAuthFailureMessage(response.error)) {
      showToast(response.error, "error");
    }
  }, [showToast]);

  // When no initialAuth is available, fetch backend cookie auth once after NextAuth resolves unauthenticated.
  useEffect(() => {
    if (initialAuth == null && status === "unauthenticated" && fallbackAuth == null) {
      void (async () => {
        const response = await authApi.me();
        setFallbackAuth({
          isLoggedIn: !!response.data?.user,
          user: response.data?.user ?? null,
        });
        if (response.error && !isAuthFailureMessage(response.error)) {
          showToast(response.error, "error");
        }
      })();
    }
  }, [initialAuth, status, fallbackAuth, showToast]);

  const resolvedAuth = useMemo(() => {
    if (status === "authenticated" && session?.user) {
      const profile = sessionUserToProfile(
        session.user as Parameters<typeof sessionUserToProfile>[0]
      );
      return {
        isLoggedIn: true,
        user: profile ?? null,
      };
    }

    if (fallbackAuth) {
      return fallbackAuth;
    }

    return { isLoggedIn: false, user: null };
  }, [status, session?.user, fallbackAuth]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: resolvedAuth.isLoggedIn,
        user: resolvedAuth.user,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
