"use client";

import { useState } from "react";
import RightSidebarLoading from "@/features/layout/components/RightSidebarLoading";
import TopRatedCard from "@/shared/components/layout/TopRatedCard";
import SidebarAuthCard from "@/features/account/components/SidebarAuthCard";
import SidebarHelpPanel from "@/features/account/components/SidebarHelpPanel";
import SidebarPasswordForm from "@/features/account/components/SidebarPasswordForm";
import SidebarProfileForm from "@/features/account/components/SidebarProfileForm";
import { useRightSidebarCards } from "@/features/layout/hooks/useRightSidebarCards";
import { useAuth } from "@/lib/contexts/AuthContext";

type SidebarView = "help" | "edit-profile" | "change-password";

export default function RightSidebar() {
  const { isLoggedIn, isAuthLoading } = useAuth();
  const { cards, loading: cardsLoading } = useRightSidebarCards();
  const [sidebarView, setSidebarView] = useState<SidebarView>("help");

  return (
    <aside className="space-y-3 px-4 sm:px-0 lg:pl-5 sidebar-border-left">
      <div key={isAuthLoading ? "auth-loading" : isLoggedIn ? `logged-in-${sidebarView}` : "logged-out"}>
        {isAuthLoading ? (
          <RightSidebarLoading />
        ) : isLoggedIn ? (
          sidebarView === "edit-profile" ? (
            <SidebarProfileForm onBack={() => setSidebarView("help")} />
          ) : sidebarView === "change-password" ? (
            <SidebarPasswordForm onBack={() => setSidebarView("help")} />
          ) : (
            <SidebarHelpPanel
              onEditProfile={() => setSidebarView("edit-profile")}
              onChangePassword={() => setSidebarView("change-password")}
            />
          )
        ) : (
          <SidebarAuthCard onSignupSuccess={() => setSidebarView("edit-profile")} />
        )}
      </div>

      {!isAuthLoading &&
        (cardsLoading ? (
          <RightSidebarLoading withAuthCard={false} />
        ) : (
          cards.map((card, index) => (
            <TopRatedCard key={`${card.title}-${card.product.name}-${index}`} card={card} index={index} />
          ))
        ))}
    </aside>
  );
}
