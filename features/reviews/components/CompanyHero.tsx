import Image from "next/image";
import { LuDot } from "react-icons/lu";
import { useTranslations } from "next-intl";
import { companyProfile } from "@/shared/data/uiContent";

interface CompanyHeroProps {
  isLoggedIn: boolean;
}

export default function CompanyHero({ isLoggedIn }: CompanyHeroProps) {
  const t = useTranslations();

  return (
    <>
      {isLoggedIn ? (
        <>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-0">
            <div className="flex gap-3">
              <Image src="/logo.png" alt="company-logo" width={64} height={64} className="flex-shrink-0" />
              <div>
                <h1 className="text-sm font-semibold text-text-heading">{companyProfile.name}</h1>
                <p className="text-xl font-bold text-primary-lighter">{companyProfile.score}</p>
                <p className="text-xs text-text-primary">
                  ({companyProfile.reviews}) {t("companyProfile.reviews")} <LuDot className="inline-block text-sm" />
                  ({companyProfile.companies}) {t("companyProfile.companies")}
                </p>
              </div>
            </div>
            <div className="flex w-full items-center gap-4 sm:w-auto">
              <Image src="/verify.svg" alt="" width={16} height={16} className="flex-shrink-0" />
              <button type="button" className="btn-primary h-9 w-full px-4 sm:h-10 sm:w-[162px]">
                {t("companyProfile.visitWebsite")}
              </button>
            </div>
          </div>
          <p className="mt-3 text-body-sm leading-[22px] tracking-normal">{companyProfile.description}</p>
        </>
      ) : (
        <div>
          <h1 className="font-inter text-[26px] font-semibold leading-9 tracking-tight text-text-darker">
            {t("companyProfile.heading")}
          </h1>
          <p className="mt-3 font-inter text-sm font-normal leading-[22px] text-text-primary">
            {t("companyProfile.description")}
          </p>
          <p className="mt-2 font-inter text-[13px] font-normal text-green-text">{t("companyProfile.readMore")}</p>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-primary-bg px-4 py-3">
        {isLoggedIn ? (
          <div className="flex min-w-0 flex-1 items-center break-words text-sm font-light leading-[22px] text-text-primary">
            {companyProfile.notification}
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-6 break-words text-sm font-light leading-[22px] text-text-primary">
            <Image src="/analytics.png" alt="info" width={16} height={16} className="flex-shrink-0" />
            {t("companyProfile.reviewsAddedToday")}
          </div>
        )}
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-bg-white p-2 text-xs text-primary">X</div>
      </div>
    </>
  );
}
