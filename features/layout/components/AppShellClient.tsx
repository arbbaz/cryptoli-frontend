"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import LeftSidebar from "@/features/layout/components/LeftSidebar";
import RightSidebar from "@/features/layout/components/RightSidebar";

const Header = dynamic(() => import("@/features/header/components/Header"), {
  loading: () => (
    <header
      className="min-h-[52px] sm:min-h-[60px] w-full overflow-visible border-b border-border"
      aria-hidden
    />
  ),
});

const Footer = dynamic(() => import("@/features/layout/components/Footer"), {
  loading: () => <footer className="border-t border-border-separator pb-0 pt-8 sm:pt-16 w-full" aria-hidden />,
});

export default function AppShellClient({
  children,
  contentClassName,
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="bg-bg-white text-foreground">
      <Header />
      <div className="page-container">
        <div className="page-main-wrap">
          <main className="main-grid">
            <div className="contents">
              <LeftSidebar />
              <section className={contentClassName ?? "content-section"}>{children}</section>
              <RightSidebar />
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
