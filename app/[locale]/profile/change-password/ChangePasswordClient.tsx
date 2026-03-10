"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "@/i18n/routing";
import Header from "@/app/components/Header";
import LeftSidebar from "@/app/components/LeftSidebar";
import RightSidebar from "@/app/components/RightSidebar";
import Footer from "@/app/components/Footer";
import Separator from "@/app/components/Separator";
import Toast from "@/app/components/Toast";
import { authApi } from "@/lib/api";
import { changePasswordFormSchema } from "@/lib/validations";

export default function ChangePasswordClient() {
  const t = useTranslations();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (!isLoggedIn) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const parsed = changePasswordFormSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const msg = first?.message ?? "Validation failed";
        setError(msg);
        setToast({ message: msg, type: "error" });
        setSubmitting(false);
        return;
      }

      const res = await authApi.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      if (res.error) {
        setError(res.error);
        setToast({ message: res.error, type: "error" });
        setSubmitting(false);
        return;
      }
      setToast({ message: t("profile.passwordChanged"), type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      const msg = t("profile.updateError");
      setError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
      <div className="bg-bg-white text-foreground">
        <Header />
        <div className="page-container">
          <div className="page-main-wrap">
            <main className="main-grid">
              <LeftSidebar />

              <section className="content-section">
                <div className="max-w-md mx-auto">
                  <div className="card-base border border-[#E5E5E5] p-5 mt-4 z-10">
                    <h3 className="text-heading-center">{t("profile.changePasswordTitle")}</h3>
                    <p className="text-description mt-2">{t("profile.changePasswordDescription")}</p>
                    <div className="mt-8 mb-8">
                      <Separator className="bg-[#E5E5E5]" />
                    </div>
                    <form onSubmit={handleSubmit} className="">
                      <div className="mb-3">
                        <label htmlFor="current-password" className="text-label mb-2 ml-2">
                          {t("profile.currentPassword")}
                        </label>
                        <input
                          id="current-password"
                          type="password"
                          placeholder={t("profile.currentPasswordPlaceholder")}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full input-field border-[#E5E5E5]"
                          required
                        />
                      </div>
                      <div className="mb-3 mt-4">
                        <label htmlFor="new-password" className="text-label mb-2 ml-2">
                          {t("profile.newPassword")}
                        </label>
                        <input
                          id="new-password"
                          type="password"
                          placeholder={t("profile.newPasswordPlaceholder")}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full input-field border-[#E5E5E5]"
                          required
                        />
                      </div>
                      <div className="mb-3 mt-4">
                        <label htmlFor="confirm-password" className="text-label mb-2 ml-2">
                          {t("profile.confirmPassword")}
                        </label>
                        <input
                          id="confirm-password"
                          type="password"
                          placeholder={t("profile.confirmPasswordPlaceholder")}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full input-field border-[#E5E5E5]"
                          required
                        />
                      </div>
                      {error && (
                        <p className="text-xs text-alert-red mb-3 text-center">{error}</p>
                      )}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="mt-3 h-10 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? t("common.auth.processing") : t("profile.updatePassword")}
                      </button>
                    </form>
                  </div>
                </div>
              </section>

              <RightSidebar />
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
