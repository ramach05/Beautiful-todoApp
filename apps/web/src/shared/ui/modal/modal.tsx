import { useEffect, useId, useRef, type ReactNode } from 'react';

import { cn } from '@/shared/lib';

interface ModalProps {
  open: boolean;
  /** Fires on Escape and a click on the overlay: the parent must sync open */
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Button panel below the content */
  footer?: ReactNode;
  className?: string;
}

/** Modal dialog on the native <dialog>: showModal gives a focus trap, Escape and background blocking */
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
        // a click on the overlay lands on the dialog itself: it does not bubble from inside
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
