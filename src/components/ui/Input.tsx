import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}
export function Input({
  className,
  label,
  error,
  inputRef,
  ...props
}: InputProps) {
  return (
    <div className="w-full space-y-1">
      {label &&
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      }
      <input
        ref={inputRef}
        className={cn(
          'flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-3 py-2 text-base text-black dark:text-white ring-offset-white dark:ring-offset-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props} />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>);

}