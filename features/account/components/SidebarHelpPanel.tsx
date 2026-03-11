"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { helpMenuItems } from "@/shared/data/uiContent";
import Separator from "@/shared/components/ui/Separator";
import { Link } from "@/i18n/routing";

interface SidebarHelpPanelProps {
  onEditProfile: () => void;
  onChangePassword: () => void;
}

export default function SidebarHelpPanel({
  onEditProfile,
  onChangePassword,
}: SidebarHelpPanelProps) {
  const t = useTranslations();
  const labels = useMemo(
    () => [
      `${t("sidebar.readMessages")} (29)`,
      t("sidebar.editProfile"),
      t("sidebar.changePassword"),
      t("sidebar.fileComplaint"),
      `${t("sidebar.writeSupportTicket")} (4)`,
    ],
    [t],
  );

  return (
    <div className="mt-4 rounded-md bg-bg-light p-3 px-4 text-center sm:px-14 sm:text-end">
      <div className="flex items-end justify-end gap-2">
        <h3 className="text-end font-inter text-[13px] font-bold text-text-primary">{t("sidebar.needHelp")}</h3>
        <Image src="/verify.svg" alt="arrow-right" width={16} height={16} />
      </div>
      <Separator />
      <div className="mt-2 space-y-2 text-center text-[13px] text-text-quaternary sm:text-end">
        {helpMenuItems.map((item, index, array) => {
          const label = labels[index] || item;
          return (
            <div key={`${item}-${index}`}>
              <div className="pb-1 text-center font-inter font-normal text-text-primary sm:text-end">
                {index === 1 ? (
                  <button type="button" onClick={onEditProfile} className="text-left hover:text-primary hover:underline">
                    {label}
                  </button>
                ) : index === 2 ? (
                  <button
                    type="button"
                    onClick={onChangePassword}
                    className="text-left hover:text-primary hover:underline"
                  >
                    {label}
                  </button>
                ) : index === 3 ? (
                  <Link href="/complaints" className="hover:text-primary hover:underline">
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </div>
              {index < array.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
