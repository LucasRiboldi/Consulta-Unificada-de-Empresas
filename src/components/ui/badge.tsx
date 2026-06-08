import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'ok' | 'alerta' | 'neutro';

const tones: Record<Tone, string> = {
  ok: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  alerta: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  neutro: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export function Badge({
  tone = 'neutro',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
