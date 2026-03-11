"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/lib/contexts/ToastContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { safeApiMessage } from "@/lib/apiErrors";
import { createComplaintSchema } from "@/lib/validations";
import { complaintsApi } from "@/features/complaints/api/client";
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const parsed = createComplaintSchema.safeParse({ title, content });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);
    try {
      const response = await complaintsApi.create({ title: parsed.data.title, content: parsed.data.content });
      if (response.error) {
        const message = safeApiMessage(response.error);
        setError(message);
        showToast(message, "error");
      } else if (response.data) {
        setTitle("");
        setContent("");
        showToast(t("complaints.submitted"), "success");
        onComplaintSubmitted?.(response.data);
      }
    } catch (error) {
      const message = safeApiMessage(error instanceof Error ? error.message : "An error occurred.");
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="pt-8 sm:pt-12 lg:pt-16">
        <div className="card-base border border-[#E5E5E5] p-5">
          <p className="py-4 text-center text-sm text-text-secondary">
            {t("complaints.signInToFile", { defaultValue: "Sign in to file a complaint." })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 sm:pt-12 lg:pt-16">
      <div className="card-base card-light p-4">
        <h2 className="mb-3 text-lg font-semibold text-text-dark">{t("companyProfile.fileComplaint")}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t("companyProfile.complaintTitle")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input-field w-full border-[#E5E5E5] py-3 text-base"
            required
          />
          <textarea
            placeholder={t("companyProfile.complaintContent")}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={5}
            className="textarea-field mt-3 w-full border-[#E5E5E5] text-[13px]"
            required
          />
          {error && <p className="mt-2 text-xs text-alert-red">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-3 h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? t("common.auth.processing") : t("companyProfile.submitComplaint")}
          </button>
        </form>
      </div>
    </div>
  );
}
