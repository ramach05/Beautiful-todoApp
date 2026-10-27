import type { ButtonHTMLAttributes, Ref } from 'react';

import { cn } from '@/shared/lib';

type Variant = 'primary' | 'danger' | 'ghost' | 'chip' | 'icon';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary — акцентная с бликом, danger — удаление, ghost — вторичные, chip — переключатели, icon — только иконка */
  variant?: Variant;
  /** Игнорируется у компактных вариантов chip и icon, у них своя раскладка */
  size?: Size;
  ref?: Ref<HTMLButtonElement>;
}

const base =
  'focus-ring inline-flex items-center justify-center gap-2 ' +
  'disabled:pointer-events-none disabled:opacity-40';

const sizes: Record<Size, string> = {
  sm: 'px-2 py-1',
  md: 'px-3 py-2 text-lg',
  lg: 'px-3 py-2 text-xl',
};

const variants: Record<Variant, string> = {
  primary: 'sheen lift rounded-[10px] bg-card-strong ring-1 ring-accent-soft hover:bg-ring-soft',
  danger: 'lift rounded-[10px] bg-card-strong ring-1 ring-accent hover:bg-accent/20',
  ghost: 'lift rounded-md bg-card-strong ring-1 ring-ring-soft hover:bg-ring-soft',
  chip:
    'lift rounded px-2.5 py-1 text-lg ring-1 ring-ring-soft hover:bg-ring-soft hover:ring-white/60 ' +
    'aria-[pressed=true]:bg-ring-soft aria-[pressed=true]:ring-white',
  icon: 'icon-btn rounded-full p-1.5 hover:bg-ring-soft',
};

/** Кнопка с вариантами раскраски и размера: курсор-указатель, lift, hover и disabled заданы здесь */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ref,
  ...rest
}: ButtonProps) {
  const compact = variant === 'chip' || variant === 'icon';
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, !compact && sizes[size], variants[variant], className)}
      {...rest}
    />
  );
}
