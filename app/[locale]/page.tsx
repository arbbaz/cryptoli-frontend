import { cookies } from "next/headers";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import { PAGE_SIZE } from "@/lib/constants";
import { getServerReviews } from "@/lib/server-api";
import HomePageClient from "@/features/home/components/HomePageClient";

export default async function Home() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const authCookieHeader = hasLikelyAuthCookie(cookieHeader) ? cookieHeader : undefined;
  const { reviews } = await getServerReviews({ limit: PAGE_SIZE, cookieHeader: authCookieHeader });

  return <HomePageClient initialReviews={reviews} />;
}
