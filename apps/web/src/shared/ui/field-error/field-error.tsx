import { cn } from '@/shared/lib';

interface FieldErrorProps {
  id: string;
  message?: string;
  className?: string;
}

/**
 * Слот ошибки поля: рендерится всегда с фиксированной высотой строки,
 * место под сообщение зарезервировано заранее и верстка при появлении не сдвигается.
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
