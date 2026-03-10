"use client";

import { useEffect, useState } from "react";
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
import { updateProfileSchema } from "@/lib/validations";

export default function EditProfileClient() {
  const t = useTranslations();
  const router = useRouter();
  const { isLoggedIn, user, refreshAuth } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  if (!isLoggedIn) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: { name?: string; username?: string; bio?: string } = {};
      if (name.trim() !== (user?.name ?? "")) payload.name = name.trim();
      if (username.trim() !== (user?.username ?? "")) payload.username = username.trim();
      if (bio.trim() !== (user?.bio ?? "")) payload.bio = bio.trim();

      if (Object.keys(payload).length === 0) {
        setToast({ message: t("profile.noChanges"), type: "error" });
        setSubmitting(false);
        return;
      }

      const parsed = updateProfileSchema.safeParse(payload);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const msg = first?.message ?? "Validation failed";
        setError(msg);
        setToast({ message: msg, type: "error" });
        setSubmitting(false);
        return;
      }

      const res = await authApi.updateProfile(parsed.data);
      if (res.error) {
        setError(res.error);
        setToast({ message: res.error, type: "error" });
        setSubmitting(false);
        return;
      }
      await refreshAuth();
      setToast({ message: t("profile.updateSuccess"), type: "success" });
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
                    <h3 className="text-heading-center">{t("profile.editTitle")}</h3>
                    <p className="text-description mt-2">{t("profile.editDescription")}</p>
                    <div className="mt-8 mb-8">
                      <Separator className="bg-[#E5E5E5]" />
                    </div>
                    <form onSubmit={handleSubmit} className="">
                      <div className="mb-3">
                        <label htmlFor="profile-name" className="text-label mb-2 ml-2">
                          {t("profile.name")}
                        </label>
                        <input
                          id="profile-name"
                          type="text"
                          placeholder={t("profile.namePlaceholder")}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full input-field border-[#E5E5E5]"
                        />
                      </div>
                      <div className="mb-3 mt-4">
                        <label htmlFor="profile-username" className="text-label mb-2 ml-2">
                          {t("profile.username")}
                        </label>
                        <input
                          id="profile-username"
                          type="text"
                          placeholder={t("profile.usernamePlaceholder")}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full input-field border-[#E5E5E5]"
                        />
                      </div>
                      <div className="mb-3 mt-4">
                        <label htmlFor="profile-bio" className="text-label mb-2 ml-2">
                          {t("profile.bio")}
                        </label>
                        <textarea
                          id="profile-bio"
                          rows={3}
                          placeholder={t("profile.bioPlaceholder")}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full textarea-field border-[#E5E5E5]"
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
                        {submitting ? t("common.auth.processing") : t("profile.saveChanges")}
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
