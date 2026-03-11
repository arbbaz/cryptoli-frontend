"use client";

import Separator from "@/shared/components/ui/Separator";
import { useSidebarProfileSettings } from "@/features/account/hooks/useSidebarProfileSettings";

interface SidebarPasswordFormProps {
  onBack: () => void;
}

export default function SidebarPasswordForm({ onBack }: SidebarPasswordFormProps) {
  const {
    t,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSubmitting,
    passwordError,
    submitPassword,
  } = useSidebarProfileSettings(true);

  return (
    <div className="card-base z-10 mt-4 border border-[#E5E5E5] p-5">
      <h3 className="text-heading-center">{t("profile.changePasswordTitle")}</h3>
      <p className="text-description mt-2">{t("profile.changePasswordDescription")}</p>
      <div className="my-6">
        <Separator className="bg-[#E5E5E5]" />
      </div>
      <form onSubmit={(event) => void submitPassword(event, onBack)}>
        <div className="mb-3">
          <label htmlFor="sidebar-current-password" className="text-label mb-2 ml-2">
            {t("profile.currentPassword")}
          </label>
          <input
            id="sidebar-current-password"
            type="password"
            placeholder={t("profile.currentPasswordPlaceholder")}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="input-field w-full border-[#E5E5E5]"
            required
          />
        </div>
        <div className="mb-3 mt-4">
          <label htmlFor="sidebar-new-password" className="text-label mb-2 ml-2">
            {t("profile.newPassword")}
          </label>
          <input
            id="sidebar-new-password"
            type="password"
            placeholder={t("profile.newPasswordPlaceholder")}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="input-field w-full border-[#E5E5E5]"
            required
          />
        </div>
        <div className="mb-3 mt-4">
          <label htmlFor="sidebar-confirm-password" className="text-label mb-2 ml-2">
            {t("profile.confirmPassword")}
          </label>
          <input
            id="sidebar-confirm-password"
            type="password"
            placeholder={t("profile.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="input-field w-full border-[#E5E5E5]"
            required
          />
        </div>
        {passwordError && <p className="mb-3 text-center text-xs text-alert-red">{passwordError}</p>}
        <button
          type="submit"
          disabled={passwordSubmitting}
          className="mt-3 h-10 w-full btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {passwordSubmitting ? t("common.auth.processing") : t("profile.updatePassword")}
        </button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 w-full text-[13px] font-semibold text-text-secondary hover:text-primary"
      >
        ← {t("sidebar.needHelp")}
      </button>
    </div>
  );
}
