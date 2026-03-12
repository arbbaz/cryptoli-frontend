import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import { PAGE_SIZE } from "@/lib/constants";
import { getServerReviews } from "@/lib/server-api";
import HomePageClient from "@/features/home/components/HomePageClient";
import HomePageContent from "@/features/home/components/HomePageContent";
import HomeReviewsList from "@/features/reviews/components/HomeReviewsList";

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
  const { reviews } = await getServerReviews({ limit: PAGE_SIZE, cookieHeader: authCookieHeader });
  return <HomeReviewsList initialReviews={reviews} />;
}

export default function Home() {
  return (
    <HomePageClient>
      <HomePageContent>
        <Suspense fallback={null}>
          <HomeReviewsAsync />
        </Suspense>
      </HomePageContent>
    </HomePageClient>
  );
}
