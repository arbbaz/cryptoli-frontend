"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

export default function EditProfilePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
