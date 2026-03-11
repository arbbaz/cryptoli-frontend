"use client";

import Image from "next/image";
import { LuDot } from "react-icons/lu";
import { useTranslations } from 'next-intl';

interface TopRatedCardProps {
  card: {
    title: string;
    product: {
      name: string;
      score: string;
      reviews: string;
      companies: string;
      badge: { text: string; color: string };
      description: string;
      bgColor: string;
      textColor: string;
      scoreColor: string;
      separatorColor: string;
      hasVerify?: boolean;
    };
  };
  index: number;
}

export default function TopRatedCard({ card, index }: TopRatedCardProps) {
  const t = useTranslations();

  return (
    <div className={`rounded-t-md mb-8 rounded-b-md border border-border-light text-white overflow-hidden min-h-[248px] ${index === 0 ? 'bg-dark-bg' : 'bg-white'}`}>
      <div className="flex items-center justify-between px-4 py-5 bg-dark-bg">
        <h3 className="text-sm font-semibold">{t('topRated.topRatedThisWeek')}</h3>
      </div>
      <div className={`space-y-2 p-3 ${card.product.bgColor} rounded-md`}>
        <div className="flex items-start sm:items-center w-full gap-4">
          <div className="flex items-center gap-2 flex-col flex-shrink-0">
            <div className="h-10 w-10 rounded-md border border-primary-border bg-bg-white" />
            <div className={`${card.product.badge.color} text-[10px] font-bold text-white ${index === 0 ? 'px-1 py-0.5' : 'px-2 py-1'} rounded-md`}>
              {card.product.badge.text}
            </div>
          </div>
          <div className={`rounded-md flex flex-col gap-1 text-sm font-bold ${card.product.textColor} ${index === 1 ? 'flex-1 min-w-0' : 'min-w-0'}`}>
            {index === 1 ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="break-words">{card.product.name}</span>
                <Image src="/verify.svg" alt="arrow-right" width={20} height={20} className="flex-shrink-0" />
              </div>
            ) : (
              <div className="break-words">{card.product.name}</div>
            )}
            <span className={`text-lg ${card.product.scoreColor} font-bold leading-[14px] tracking-normal sm:mr-4`}>
              {card.product.score}
            </span>
            <p className={`mt-1 text-xs ${card.product.textColor} font-normal break-words`}>
              ({card.product.reviews}) <LuDot className="inline-block text-sm font-bold" /> ({card.product.companies}) {t('companyProfile.companies')}
            </p>
          </div>
        </div>
        <div className={`h-[0.5px] mb-4 mt-4 w-full ${card.product.separatorColor}`}></div>
        <p className={`mt-2 text-[13px] ${card.product.textColor} break-words`}>{card.product.description}</p>
        <button className="mt-3 h-10 w-full rounded-md bg-primary text-xs font-semibold text-white">
          {t('topRated.visitWebsite')}
        </button>
      </div>
    </div>
  );
}
