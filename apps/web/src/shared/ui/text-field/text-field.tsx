import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '@/shared/lib';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** default — карточный фон с кольцом, search — подчеркивание-трек с акцентной линией на фокусе */
  variant?: 'default' | 'search';
  ref?: Ref<HTMLInputElement>;
}

const base =
  'focus-ring min-w-0 bg-card-strong ring-1 ring-ring-soft placeholder:text-gray-400 ' +
  'hover:bg-card hover:ring-white/40 focus:ring-white focus:outline-none ' +
  'transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none';

const variants = {
  default: 'rounded-[10px] px-3 py-2 text-lg',
  search:
    'field-underline rounded-md border-b-2 border-accent-soft bg-card px-3 py-1.5 text-xl ring-0',
} as const;

/**
 * Текстовый инпут с общими состояниями: hover и focus подсвечивают кольцо,
 * у search-варианта акцентная линия выезжает при фокусе.
 * Ширина и flex-поведение вызывающий код задает через className.
 */
export function TextField({ variant = 'default', className, ref, ...rest }: TextFieldProps) {
  return <input ref={ref} className={cn(base, variants[variant], className)} {...rest} />;
}
