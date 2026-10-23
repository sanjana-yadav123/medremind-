import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlight?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, highlight = false, className = '', ...props }) => {
  return (
    <div
      className={`rounded-2xl p-5 md:p-6 transition-all ${
        highlight
          ? 'bg-brand-50 border-3 border-brand-700 shadow-md dark:bg-brand-950/40 dark:border-brand-500'
          : 'bg-white border-2 border-slate-300 shadow-sm dark:bg-slate-900 dark:border-slate-700'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
