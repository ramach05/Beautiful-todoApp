import { cn } from '@/shared/lib';

interface FieldErrorProps {
  id: string;
  message?: string;
  className?: string;
}

/**
 * Field error slot: always rendered with a fixed line height,
 * space for the message is reserved upfront so the layout does not shift when it appears.
 */
export function FieldError({ id, message, className }: FieldErrorProps) {
  return (
    <p
      id={id}
      aria-live="polite"
      className={cn('h-5 truncate pl-1 text-sm leading-5 text-accent', className)}
    >
      {message ?? ''}
    </p>
  );
}
