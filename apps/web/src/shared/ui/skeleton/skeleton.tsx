import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';

interface SkeletonProps {
  /** Text for screen readers; visible only to them */
  label?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Accessible placeholder container: declares a loading region (role=status + sr-only)
 * and marks it busy (aria-busy). SkeletonBlock frames are laid out inside.
 */
export function Skeleton({ label = 'Loading', children, className }: SkeletonProps) {
  return (
    <div role="status" aria-busy="true" className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Shimmering rectangle frame for a single element: pure decoration, hidden from AT */
export function SkeletonBlock({ className }: { className?: string }) {
  return <span aria-hidden className={cn('skeleton block rounded', className)} />;
}
