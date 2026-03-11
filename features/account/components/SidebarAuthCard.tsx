"use client";

import { FcGoogle } from "react-icons/fc";
import Separator from "@/shared/components/ui/Separator";
import { useSidebarAuthForm } from "@/features/account/hooks/useSidebarAuthForm";

export default function SidebarAuthCard() {
  const {
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
  } = useSidebarAuthForm();

  return (
    <div>
      <div className="card-base z-10 mt-4 border border-[#E5E5E5] p-5">
        <h3 className="text-heading-center">
          {isSignup ? t("common.auth.createAccount") : t("common.auth.signIn")}
        </h3>
        <p className="text-description mt-2">
          {isSignup ? t("common.auth.itsFree") : t("common.auth.welcomeBack")}
        </p>
        <button type="button" disabled className="btn-disabled-secondary">
          <FcGoogle size={21} />
          {t("common.auth.continueWithGoogle")}
        </button>
        <div className="my-8">
          <Separator className="bg-[#E5E5E5]" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="sidebar-auth-email" className="text-label mb-2 ml-2">
              {t("common.auth.emailAddress")}
            </label>
            <input
              id="sidebar-auth-email"
              type="email"
              placeholder={t("common.auth.enterEmail")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field w-full border-[#E5E5E5]"
              required
            />
          </div>
          <div className="mb-3 mt-4">
            <label htmlFor="sidebar-auth-password" className="text-label mb-2 ml-2">
              {t("common.auth.password")}
            </label>
            <input
              id="sidebar-auth-password"
              type="password"
              placeholder={t("common.auth.password")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field w-full border-[#E5E5E5]"
              required
            />
          </div>
          {error && <p className="mb-3 text-center text-xs text-alert-red">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 h-10 w-full btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? t("common.auth.processing")
              : isSignup
                ? t("common.auth.signUp")
                : t("common.auth.signIn")}
          </button>
        </form>
      </div>
      <div className="sidebar-right-panel">
        {isSignup ? t("common.auth.alreadyHaveAccount") : t("common.auth.dontHaveAccount")}{" "}
        <button type="button" onClick={toggleMode} className="text-[13px] font-semibold text-[#111111]">
          {isSignup ? t("common.auth.signIn") : t("common.auth.signUp")}
        </button>
      </div>
    </div>
  );
}
