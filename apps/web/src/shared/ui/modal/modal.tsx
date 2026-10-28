import { useEffect, useId, useRef, type ReactNode } from 'react';

import { cn } from '@/shared/lib';

interface ModalProps {
  open: boolean;
  /** Срабатывает на Escape и клик по затемнению: родитель должен синхронизировать open */
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Панель кнопок под содержимым */
  footer?: ReactNode;
  className?: string;
}

/** Модальный диалог на нативном <dialog>: showModal дает фокус-ловушку, Escape и блокировку фона */
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // клик по затемнению приходит на сам dialog: внутрь не всплывает
        if (event.target === ref.current) ref.current?.close();
      }}
      className={cn(
        'm-auto w-[min(92vw,24rem)] border-none rounded-[10px] bg-card-strong p-5 text-white backdrop:bg-black/60',
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <h3 id={titleId} className="text-xl">
          {title}
        </h3>
        <div className="text-lg text-gray-300">{children}</div>
        {footer && <div className="mt-1 flex justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}
