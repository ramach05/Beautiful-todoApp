import { cn } from '@/shared/lib';

/** Вращающийся индикатор: чистая декорация, состояние отдается кнопке через aria-busy */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-4 animate-spin rounded-full border-2 border-white/40 border-t-white',
        className,
      )}
    />
  );
}
