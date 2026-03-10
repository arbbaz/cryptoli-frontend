import { cookies } from "next/headers";
import { getServerComplaints } from "@/lib/server-api";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import ComplaintsClient from "./ComplaintsClient";

export default async function ComplaintsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const authCookieHeader = hasLikelyAuthCookie(cookieHeader) ? cookieHeader : undefined;
  const { complaints } = await getServerComplaints({
    limit: 10,
    page: 1,
    cookieHeader: authCookieHeader,
  });

  return <ComplaintsClient initialComplaints={complaints} />;
}
