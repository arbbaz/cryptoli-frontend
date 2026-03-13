"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/lib/contexts/ToastContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { authApi } from "@/features/auth/api/client";
import { changePasswordFormSchema, updateProfileSchema } from "@/lib/validations";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const USERNAME_CHECK_DEBOUNCE_MS = 400;

export type UsernameCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useSidebarProfileSettings(enabled: boolean) {
  const t = useTranslations();
  const { showToast } = useToast();
  const { user, refreshAuth } = useAuth();
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<UsernameCheckStatus>("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const usernameCheckIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !user) return;
    setProfileUsername(user.username ?? "");
    setProfileBio(user.bio ?? "");
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled || !user) return;
    const raw = profileUsername.trim();
    if (raw.length === 0) {
      setUsernameCheckStatus("idle");
      return;
    }
    if (raw.length < USERNAME_MIN || raw.length > USERNAME_MAX || !USERNAME_REGEX.test(raw)) {
      setUsernameCheckStatus("invalid");
      return;
    }
    if (raw === (user.username ?? "")) {
      setUsernameCheckStatus("available");
      return;
    }
    const timer = setTimeout(async () => {
      const checkId = ++usernameCheckIdRef.current;
      setUsernameCheckStatus("checking");
      const response = await authApi.checkUsername(raw);
      if (checkId !== usernameCheckIdRef.current) return;
      if (response.error) {
        setUsernameCheckStatus("idle");
        return;
      }
      setUsernameCheckStatus(response.data?.available ? "available" : "taken");
    }, USERNAME_CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, user?.username, profileUsername]);

  const submitProfile = async (event: React.FormEvent, onSuccess?: () => void) => {
    event.preventDefault();
    if (!user) return;

    setProfileError("");
    setProfileSubmitting(true);
    try {
      const payload: { username?: string; bio?: string } = {};
      if (profileUsername.trim() !== (user.username ?? "")) payload.username = profileUsername.trim();
      if (profileBio.trim() !== (user.bio ?? "")) payload.bio = profileBio.trim();

      if (Object.keys(payload).length === 0) {
        const message = t("profile.noChanges");
        setProfileError(message);
        showToast(message, "error");
        return;
      }

      const parsed = updateProfileSchema.safeParse(payload);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Validation failed";
        setProfileError(message);
        showToast(message, "error");
        return;
      }

      const response = await authApi.updateProfile(parsed.data);
      if (response.error) {
        setProfileError(response.error);
        showToast(response.error, "error");
        return;
      }

      await refreshAuth();
      showToast(t("profile.updateSuccess"), "success");
      onSuccess?.();
    } catch {
      const message = t("profile.updateError");
      setProfileError(message);
      showToast(message, "error");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const submitPassword = async (event: React.FormEvent, onSuccess?: () => void) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSubmitting(true);

    try {
      const parsed = changePasswordFormSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Validation failed";
        setPasswordError(message);
        showToast(message, "error");
        return;
      }

      const response = await authApi.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      if (response.error) {
        setPasswordError(response.error);
        showToast(response.error, "error");
        return;
      }

      showToast(t("profile.passwordChanged"), "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch {
      const message = t("profile.updateError");
      setPasswordError(message);
      showToast(message, "error");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return {
    t,
    profileUsername,
    setProfileUsername,
    profileBio,
    setProfileBio,
    profileSubmitting,
    profileError,
    usernameCheckStatus,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSubmitting,
    passwordError,
    submitProfile,
    submitPassword,
  };
}
