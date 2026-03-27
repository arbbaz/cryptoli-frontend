import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import { PAGE_SIZE } from "@/lib/constants";
import { getQueryClient } from "@/lib/queryClient";
import { createInfiniteFeedData } from "@/lib/infiniteFeedCache";
import { queryKeys } from "@/lib/queryKeys";
import { getServerComplaints } from "@/lib/server-api";
import ComplaintsPageClient from "@/features/complaints/components/ComplaintsPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("complaintsTitle"),
    description: t("complaintsDescription"),
    openGraph: {
      title: t("complaintsTitle"),
      description: t("complaintsDescription"),
    },
  };
}

export default async function ComplaintsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const authCookieHeader = hasLikelyAuthCookie(cookieHeader) ? cookieHeader : undefined;
  const { complaints, pagination } = await getServerComplaints({
    limit: PAGE_SIZE,
    page: 1,
    cookieHeader: authCookieHeader,
  });
  const queryClient = getQueryClient();

  queryClient.setQueryData(
    queryKeys.complaintsFeed(),
    createInfiniteFeedData("complaints", complaints, pagination, 1),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ComplaintsPageClient initialComplaints={complaints} />
    </HydrationBoundary>
  );
}
