'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Calendar, Pill, History, Camera, Users } from 'lucide-react';

export const FooterNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    {
      href: '/dashboard',
      label: t('nav.dashboard'),
      icon: <Calendar className="w-7 h-7" aria-hidden="true" />,
    },
    {
      href: '/medicines',
      label: t('nav.medicines'),
      icon: <Pill className="w-7 h-7" aria-hidden="true" />,
    },
    {
      href: '/history',
      label: t('nav.history'),
      icon: <History className="w-7 h-7" aria-hidden="true" />,
    },
    {
      href: '/prescriptions',
      label: t('nav.prescriptions'),
      icon: <Camera className="w-7 h-7" aria-hidden="true" />,
    },
    {
      href: '/caregivers',
      label: t('nav.caregivers'),
      icon: <Users className="w-7 h-7" aria-hidden="true" />,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-800 shadow-lg safe-bottom"
      aria-label="मुख्य नेविगेशन (Main Navigation)"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[56px] rounded-xl transition-all ${
                isActive
                  ? 'text-brand-800 dark:text-brand-400 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-bold'
              } focus:outline-none focus:ring-2 focus:ring-brand-500`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-brand-100 dark:bg-brand-950/60' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-xs sm:text-sm mt-0.5 tracking-tight text-center truncate max-w-[72px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
