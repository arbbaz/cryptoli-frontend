"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { complaintsApi } from "@/lib/api";
import { createComplaintSchema } from "@/lib/validations";
import { useToast } from "@/app/contexts/ToastContext";
import { useAuth } from "@/app/contexts/AuthContext";
import type { Complaint } from "@/lib/types";

interface FileComplaintFormProps {
  onComplaintSubmitted?: (complaint: Complaint) => void;
}

export default function FileComplaintForm({ onComplaintSubmitted }: FileComplaintFormProps) {
  const t = useTranslations();
  const { showToast } = useToast();
  const { isLoggedIn } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = createComplaintSchema.safeParse({ title, content });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);
    try {
      const response = await complaintsApi.create({
        title: parsed.data.title,
        content: parsed.data.content,
      });

      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
      } else if (response.data) {
        setTitle("");
        setContent("");
        showToast(t("complaints.submitted"), "success");
        onComplaintSubmitted?.(response.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="pt-8 sm:pt-12 lg:pt-16">
        <div className="card-base border border-[#E5E5E5] p-5">
          <p className="text-sm text-text-secondary text-center py-4">
            {t("complaints.signInToFile", { defaultValue: "Sign in to file a complaint." })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 sm:pt-12 lg:pt-16">
      <div className="card-base card-light p-4">
        <h2 className="text-lg font-semibold text-text-dark mb-3">
          {t("companyProfile.fileComplaint")}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t("companyProfile.complaintTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="py-3 w-full input-field border-[#E5E5E5] text-base"
            required
          />
          <textarea
            placeholder={t("companyProfile.complaintContent")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="textarea-field mt-3 w-full text-[13px] border-[#E5E5E5]"
            required
          />
          {error && <p className="text-xs text-alert-red mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-3 h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t("common.auth.processing") : t("companyProfile.submitComplaint")}
          </button>
        </form>
      </div>
    </div>
  );
}
