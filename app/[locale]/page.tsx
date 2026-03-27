import type { Metadata } from "next";
import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import { PAGE_SIZE } from "@/lib/constants";
import { getQueryClient } from "@/lib/queryClient";
import { createInfiniteFeedData } from "@/lib/infiniteFeedCache";
import { queryKeys } from "@/lib/queryKeys";
import { getServerReviews } from "@/lib/server-api";
import HomePageClient from "@/features/home/components/HomePageClient";
import HomePageContent from "@/features/home/components/HomePageContent";
import HomeReviewsList from "@/features/reviews/components/HomeReviewsList";
import FeedLoading from "@/shared/components/feed/FeedLoading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
    },
  };
}

async function HomeReviewsAsync() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const authCookieHeader = hasLikelyAuthCookie(cookieHeader) ? cookieHeader : undefined;
  const { reviews, pagination } = await getServerReviews({
    limit: PAGE_SIZE,
    page: 1,
    cookieHeader: authCookieHeader,
  });
  const t = await getTranslations({ namespace: "feed" });
  const queryClient = getQueryClient();

  queryClient.setQueryData(
    queryKeys.reviewsFeed({ status: "APPROVED" }),
    createInfiniteFeedData("reviews", reviews, pagination, 1),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeReviewsList initialReviews={reviews} emptyMessage={t("emptyReviews")} />
    </HydrationBoundary>
  );
}

export default function Home() {
  return (
    <HomePageClient>
      <HomePageContent>
        <Suspense fallback={<FeedLoading />}>
          <HomeReviewsAsync />
        </Suspense>
      </HomePageContent>
    </HomePageClient>
  );
}
