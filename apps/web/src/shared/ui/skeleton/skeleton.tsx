import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';

interface SkeletonProps {
  /** Текст для скринридеров; виден только им */
  label?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Доступный контейнер-заглушка: объявляет область загрузки (role=status + sr-only)
 * и помечает ее занятой (aria-busy). Внутри раскладываются SkeletonBlock-каркасы.
 */
export function Skeleton({ label = 'Loading', children, className }: SkeletonProps) {
  return (
    <div role="status" aria-busy="true" className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Шиммерящий прямоугольник-каркас отдельного элемента: чистая декорация, скрыт от AT */
export function SkeletonBlock({ className }: { className?: string }) {
  return <span aria-hidden className={cn('skeleton block rounded', className)} />;
}
