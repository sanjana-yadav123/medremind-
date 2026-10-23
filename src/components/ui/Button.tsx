import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline';
  size?: 'normal' | 'large' | 'huge';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'normal',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-2xl transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  // Minimum touch sizes: 48px for normal, 60px for large, 72px for huge
  const sizeClasses = {
    normal: 'min-h-[50px] min-w-[50px] px-5 py-3 text-lg gap-2',
    large: 'min-h-[64px] px-6 py-4 text-xl gap-3',
    huge: 'min-h-[76px] px-8 py-5 text-2xl gap-4 w-full shadow-lg',
  }[size];

  const variantClasses = {
    primary:
      'bg-brand-700 hover:bg-brand-800 text-white border-2 border-brand-900 focus:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-700',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-400 focus:ring-slate-400 dark:bg-slate-800 dark:text-white dark:border-slate-600',
    danger:
      'bg-red-700 hover:bg-red-800 text-white border-2 border-red-950 focus:ring-red-500',
    warning:
      'bg-amber-600 hover:bg-amber-700 text-white border-2 border-amber-900 focus:ring-amber-500',
    outline:
      'bg-transparent hover:bg-slate-100 text-slate-800 border-2 border-slate-700 focus:ring-slate-400 dark:text-white dark:hover:bg-slate-800',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
