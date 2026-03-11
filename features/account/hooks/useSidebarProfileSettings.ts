"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/lib/contexts/ToastContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { authApi } from "@/features/auth/api/client";
import { changePasswordFormSchema, updateProfileSchema } from "@/lib/validations";

export function useSidebarProfileSettings(enabled: boolean) {
  const t = useTranslations();
  const { showToast } = useToast();
  const { user, refreshAuth } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!enabled || !user) return;
    setProfileName(user.name ?? "");
    setProfileUsername(user.username ?? "");
    setProfileBio(user.bio ?? "");
  }, [enabled, user]);

  const submitProfile = async (event: React.FormEvent, onSuccess?: () => void) => {
    event.preventDefault();
    if (!user) return;

    setProfileError("");
    setProfileSubmitting(true);
    try {
      const payload: { name?: string; username?: string; bio?: string } = {};
      if (profileName.trim() !== (user.name ?? "")) payload.name = profileName.trim();
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
    profileName,
    setProfileName,
    profileUsername,
    setProfileUsername,
    profileBio,
    setProfileBio,
    profileSubmitting,
    profileError,
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
