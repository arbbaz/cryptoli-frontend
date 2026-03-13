"use client";

import Separator from "@/shared/components/ui/Separator";
import { useSidebarProfileSettings } from "@/features/account/hooks/useSidebarProfileSettings";

interface SidebarProfileFormProps {
  onBack: () => void;
}

export default function SidebarProfileForm({ onBack }: SidebarProfileFormProps) {
  const {
    t,
    profileUsername,
    setProfileUsername,
    profileBio,
    setProfileBio,
    profileSubmitting,
    profileError,
    usernameCheckStatus,
    submitProfile,
  } = useSidebarProfileSettings(true);

  return (
    <div className="card-base z-10 mt-4 border border-[#E5E5E5] p-5">
      <h3 className="text-heading-center">{t("profile.editTitle")}</h3>
      <p className="text-description mt-2">{t("profile.editDescription")}</p>
      <div className="my-6">
        <Separator className="bg-[#E5E5E5]" />
      </div>
      <form onSubmit={(event) => void submitProfile(event, onBack)}>
        <div className="mb-3">
          <label htmlFor="sidebar-profile-username" className="text-label mb-2 ml-2">
            {t("profile.username")}
          </label>
          <input
            id="sidebar-profile-username"
            type="text"
            placeholder={t("profile.usernamePlaceholder")}
            value={profileUsername}
            onChange={(event) => setProfileUsername(event.target.value)}
            className={`input-field w-full border-[#E5E5E5] ${
              usernameCheckStatus === "taken"
                ? "border-alert-red"
                : usernameCheckStatus === "available"
                  ? "border-green-500"
                  : ""
            }`}
          />
          {usernameCheckStatus === "checking" && (
            <p className="mt-1.5 ml-2 text-xs text-text-secondary">{t("profile.usernameChecking")}</p>
          )}
          {usernameCheckStatus === "available" && (
            <p className="mt-1.5 ml-2 text-xs text-green-600">{t("profile.usernameAvailable")}</p>
          )}
          {usernameCheckStatus === "taken" && (
            <p className="mt-1.5 ml-2 text-xs text-alert-red">{t("profile.usernameTaken")}</p>
          )}
          {usernameCheckStatus === "invalid" && profileUsername.trim().length > 0 && (
            <p className="mt-1.5 ml-2 text-xs text-alert-red">{t("profile.usernameInvalid")}</p>
          )}
        </div>
        <div className="mb-3 mt-4">
          <label htmlFor="sidebar-profile-bio" className="text-label mb-2 ml-2">
            {t("profile.bio")}
          </label>
          <textarea
            id="sidebar-profile-bio"
            rows={3}
            placeholder={t("profile.bioPlaceholder")}
            value={profileBio}
            onChange={(event) => setProfileBio(event.target.value)}
            className="textarea-field w-full border-[#E5E5E5]"
          />
        </div>
        {profileError && <p className="mb-3 text-center text-xs text-alert-red">{profileError}</p>}
        <button
          type="submit"
          disabled={profileSubmitting}
          className="mt-3 h-10 w-full btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {profileSubmitting ? t("common.auth.processing") : t("profile.saveChanges")}
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
