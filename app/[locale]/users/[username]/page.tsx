import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AppShell from "@/features/layout/components/AppShell";
import UserProfilePageClient from "./UserProfilePageClient";

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: `${username} – ${t("homeTitle")}`,
    description: t("homeDescription"),
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  return (
    <AppShell>
      <UserProfilePageClient username={username} />
    </AppShell>
  );
}

