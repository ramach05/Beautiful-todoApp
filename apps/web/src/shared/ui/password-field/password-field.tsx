import { useTranslation } from 'react-i18next';
import { useState, type InputHTMLAttributes, type Ref } from 'react';

import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';
import { visibilityIcon, visibilityOffIcon } from '@/shared/ui/assets';

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

/**
 * Инпут пароля с кнопкой-глазом: переключает type password/text,
 * подсказка на hover и доступное имя описывают действие кнопки.
 */
export function PasswordField({ className, ref, ...rest }: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const label = t(visible ? 'auth.hide_password' : 'auth.show_password');
  return (
    <div className="relative flex items-center">
      <TextField
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
        {...rest}
      />
      <Button
        variant="icon"
        className="tip absolute top-1/2 right-1.5 -translate-y-1/2"
        aria-label={label}
        data-tip={label}
        onClick={() => setVisible((prev) => !prev)}
      >
        <img
          src={visible ? visibilityOffIcon : visibilityIcon}
          alt=""
          aria-hidden
          className="size-5"
        />
      </Button>
    </div>
  );
}
