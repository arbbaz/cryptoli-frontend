"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useToast } from "@/lib/contexts/ToastContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { trackAnalyticsEvent } from "@/shared/components/analytics/AnalyticsTracker";
import { authApi } from "@/features/auth/api/client";
import { loginSchema, registerSchema } from "@/lib/validations";

/**
 * Humanized placeholder username from email (e.g. arbaz@gmail.com → arbaz21).
 * Base from email (letters/numbers/underscore, max 20 chars) + small number or _nn for uniqueness.
 */
function generatePlaceholderUsername(email: string): string {
  const base = (email.split("@")[0] || "user")
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  const name = base.length >= 2 ? base : "user";
  const num = 10 + (Date.now() % 90) + Math.floor(Math.random() * 10);
  return `${name}${num}`;
}

export function useSidebarAuthForm(options?: { onSignupSuccess?: () => void }) {
  const t = useTranslations();
  const { showToast } = useToast();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const onSignupSuccess = options?.onSignupSuccess;

  const completeAuthentication = (message: string) => {
    showToast(message, "success");
    void refreshAuth();
  };

  const signInWithCredentials = async () => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      showToast(result.error, "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        const username = generatePlaceholderUsername(email);
        const parsed = registerSchema.safeParse({ email, username, password });
        if (!parsed.success) {
          const message = parsed.error.issues[0]?.message ?? "Validation failed";
          setError(message);
          showToast(message, "error");
          return;
        }

        const response = await authApi.register(parsed.data);
        if (response.error) {
          setError(response.error);
          showToast(response.error, "error");
          return;
        }

        if (await signInWithCredentials()) {
          trackAnalyticsEvent("signup_completed");
          completeAuthentication("Account created successfully!");
          onSignupSuccess?.();
        }

        return;
      }

      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Validation failed";
        setError(message);
        showToast(message, "error");
        return;
      }

      const response = await authApi.login(parsed.data);
      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
        return;
      }

      if (await signInWithCredentials()) {
        completeAuthentication("Logged in successfully!");
      }
    } catch {
      const message = "An error occurred. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignup((prev) => !prev);
    setError("");
  };

  return {
    t,
    email,
    setEmail,
    password,
    setPassword,
    isSignup,
    submitting,
    error,
    handleSubmit,
    toggleMode,
  };
}
