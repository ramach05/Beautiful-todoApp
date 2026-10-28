import { cn } from '@/shared/lib';

/** Spinning indicator: pure decoration, state is exposed on the button via aria-busy */
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
