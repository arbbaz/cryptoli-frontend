import { cookies } from "next/headers";
import { hasLikelyAuthCookie } from "@/lib/authCookies";
import { PAGE_SIZE } from "@/lib/constants";
import { getServerComplaints } from "@/lib/server-api";
import ComplaintsPageClient from "@/features/complaints/components/ComplaintsPageClient";

export default async function ComplaintsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const authCookieHeader = hasLikelyAuthCookie(cookieHeader) ? cookieHeader : undefined;
  const { complaints } = await getServerComplaints({ limit: PAGE_SIZE, page: 1, cookieHeader: authCookieHeader });

  return <ComplaintsPageClient initialComplaints={complaints} />;
}
