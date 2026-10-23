import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, id, className = '', ...props }) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={inputId} className="text-xl font-bold text-slate-900 dark:text-slate-100">
        {label}
      </label>
      <input
        id={inputId}
        className={`min-h-[52px] px-4 py-3 text-xl rounded-xl border-2 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-4 ${
          error
            ? 'border-red-600 focus:ring-red-400'
            : 'border-slate-400 focus:border-brand-600 focus:ring-brand-400 dark:border-slate-600'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="text-base text-slate-600 dark:text-slate-400">
          {helperText}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="text-base font-semibold text-red-600 dark:text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
