"use client";

import { AiOutlineMore } from "react-icons/ai";
import { useTranslations } from 'next-intl';

interface AlertCardProps {
  alert: {
    type: string;
    title: string;
    content: string;
    score?: string;
    reports?: string;
    bgColor: string;
    textColor: string;
    height: string;
    padding: string;
    hasScore: boolean;
  };
  index: number;
}

export default function AlertCard({ alert, index }: AlertCardProps) {
  const t = useTranslations();
  
  const getTranslatedTitle = () => {
    if (alert.type === 'trending') {
      return t('alerts.trendingNow');
    } else if (alert.type === 'scam') {
      return t('alerts.latestScamAlert');
    }
    return alert.title;
  };

  const getTranslatedReports = () => {
    if (alert.reports && alert.reports.includes('reports in 24hrs')) {
      return alert.reports.replace('reports in 24hrs', t('alerts.reportsIn24hrs'));
    }
    return alert.reports;
  };

  return (
    <div className={index === 1 ? "space-y-1 text-xs font-semibold" : ""}>
      <div className={`${alert.height} rounded-md ${alert.bgColor} ${alert.padding} text-xs font-semibold ${alert.textColor}`}>
        <div className="flex justify-between items-start gap-2">
          <span className="break-words flex-1">{getTranslatedTitle()}</span>
          <AiOutlineMore className="inline-block text-sm flex-shrink-0" />
        </div>
        {alert.hasScore ? (
          <>
            <span className="font-semibold break-words">{alert.content}</span> <span className="font-normal">{alert.score}</span>
            <br />
            <span className="font-normal break-words">{getTranslatedReports()}</span>
          </>
        ) : (
          <span className="font-normal opacity-90 break-words min-h-[18px] inline-block">{alert.content}</span>
        )}
      </div>
    </div>
  );
}
