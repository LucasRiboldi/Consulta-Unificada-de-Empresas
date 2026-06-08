import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 aria-[invalid=true]:border-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
