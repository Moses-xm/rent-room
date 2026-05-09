import type { ReactNode } from 'react';

const variants = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger:  'bg-danger-bg  text-danger',
  info:    'bg-info-bg    text-info',
  muted:   'bg-surface-2  text-text-muted',
  accent:  'bg-primary-tint text-primary-dark',
} as const;

type StatusPillVariant = keyof typeof variants;

type StatusPillProps = {
  variant: StatusPillVariant;
  children: ReactNode;
};

export function StatusPill({ variant, children }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-emphasis ${variants[variant]}`}
    >
      <span className="w-1.25 h-1.25 rounded-full bg-current opacity-70 shrink-0" />
      {children}
    </span>
  );
}
