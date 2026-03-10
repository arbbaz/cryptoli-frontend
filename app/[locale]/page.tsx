import { cookies } from "next/headers";
import { getServerReviews } from "@/lib/server-api";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import HomeClient from "./HomeClient";

export default async function Home() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const authCookieHeader = hasLikelyAuthCookie(cookieHeader)
    ? cookieHeader
    : undefined;
  const { reviews } = await getServerReviews({
    limit: 10,
    cookieHeader: authCookieHeader,
  });

  return <HomeClient initialReviews={reviews} />;
}


