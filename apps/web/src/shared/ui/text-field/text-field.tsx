import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '@/shared/lib';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** default — карточный фон с кольцом, search — мягкая нижняя линия с акцентным подчеркиванием на фокусе */
  variant?: 'default' | 'search';
  ref?: Ref<HTMLInputElement>;
}

const base =
  'min-w-0 placeholder:text-gray-400 ' +
  'transition-[background-color,box-shadow,border-color] duration-200 motion-reduce:transition-none';

const variants = {
  default:
    'rounded-[10px] bg-card-strong px-3 py-2 text-lg ring-1 ring-ring-soft ' +
    'not-focus:hover:bg-card not-focus:hover:ring-white/40 focus:ring-accent focus:outline-none',
  search:
    'field-underline rounded-md border-b-2 border-ring-soft bg-card px-3 py-1.5 text-xl ' +
    'not-focus:hover:border-accent-soft focus:bg-card-strong focus:outline-none',
} as const;

/**
 * Текстовый инпут с общими состояниями: у default фокус перекрашивает кольцо в акцент,
 * у search единственный индикатор — акцентная линия снизу, фон чуть густеет.
 * Ховер не трогает сфокусированное поле (not-focus). Ширина — через className.
 */
export function TextField({ variant = 'default', className, ref, ...rest }: TextFieldProps) {
  return <input ref={ref} className={cn(base, variants[variant], className)} {...rest} />;
}
