import React from 'react';
import { CheckCircle2, Clock, SkipForward, AlertTriangle, HelpCircle } from 'lucide-react';
import { DoseStatus } from '@/lib/types/database';

export interface BadgeProps {
  status: DoseStatus | 'active' | 'archived';
  labelOverride?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, labelOverride }) => {
  const config = {
    taken: {
      bg: 'bg-green-100 text-green-900 border-2 border-green-700 dark:bg-green-950/80 dark:text-green-200 dark:border-green-500',
      icon: <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" aria-hidden="true" />,
      defaultLabel: 'ले ली (Taken)',
    },
    scheduled: {
      bg: 'bg-blue-100 text-blue-900 border-2 border-blue-700 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-500',
      icon: <Clock className="w-5 h-5 text-blue-700 dark:text-blue-400" aria-hidden="true" />,
      defaultLabel: 'बाकी है (Scheduled)',
    },
    skipped: {
      bg: 'bg-amber-100 text-amber-900 border-2 border-amber-700 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-500',
      icon: <SkipForward className="w-5 h-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />,
      defaultLabel: 'छोड़ दी (Skipped)',
    },
    missed: {
      bg: 'bg-red-100 text-red-950 border-2 border-red-700 dark:bg-red-950/80 dark:text-red-200 dark:border-red-500',
      icon: <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400" aria-hidden="true" />,
      defaultLabel: 'छूट गई (Missed)',
    },
    pending_confirmation: {
      bg: 'bg-purple-100 text-purple-900 border-2 border-purple-700 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-500',
      icon: <HelpCircle className="w-5 h-5 text-purple-700 dark:text-purple-400" aria-hidden="true" />,
      defaultLabel: 'पुष्टि बाकी (Pending)',
    },
    active: {
      bg: 'bg-emerald-100 text-emerald-900 border-2 border-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />,
      defaultLabel: 'चालू (Active)',
    },
    archived: {
      bg: 'bg-slate-200 text-slate-800 border-2 border-slate-500 dark:bg-slate-800 dark:text-slate-300',
      icon: <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />,
      defaultLabel: 'बंद (Archived)',
    },
  }[status] || {
    bg: 'bg-slate-100 text-slate-900 border-2 border-slate-400',
    icon: <Clock className="w-5 h-5" aria-hidden="true" />,
    defaultLabel: status,
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-base ${config.bg}`}>
      {config.icon}
      <span>{labelOverride || config.defaultLabel}</span>
    </span>
  );
};
