import { zodResolver } from '@hookform/resolvers/zod';
import { useUnit } from 'effector-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { signUp, type AuthErrorKey } from '@/features/auth';
import { $locale } from '@/features/locale';
import { Button } from '@/shared/ui/button';
import { fieldErrorKey } from '@/shared/i18n';
import { PasswordField } from '@/shared/ui/password-field';
import { Spinner } from '@/shared/ui/spinner';
import { TextField } from '@/shared/ui/text-field';

// Сообщения не переводим: UI маппит code ошибки zod на ключ словаря через fieldErrorKey
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(4),
});

type RegisterValues = z.infer<typeof registerSchema>;

export interface RegisterPageProps {
  onSuccess: () => void;
  /** Ссылка на вход проводится снаружи, чтобы страница не зависела от роутера в тестах */
  footer?: ReactNode;
}

export function RegisterPage({ onSuccess, footer }: RegisterPageProps) {
  const { t } = useTranslation();
  const locale = useUnit($locale);
  const { register, handleSubmit, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const [rootError, setRootError] = useState<AuthErrorKey | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    const failure = await signUp(values.email, values.password, locale);
    if (failure) {
      setRootError(failure);
      return;
    }
    onSuccess();
  });

  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-3 pt-6"
      noValidate
      onSubmit={(event) => void onSubmit(event)}
    >
      <h2 className="text-center text-3xl">{t('auth.sign_up')}</h2>

      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="register-name">
          {t('auth.name')}
        </label>
        <TextField
          id="register-name"
          type="text"
          className="w-full"
          placeholder={t('auth.name')}
          autoComplete="name"
          aria-invalid={formState.errors.name !== undefined}
          aria-describedby={formState.errors.name ? 'register-name-error' : undefined}
          {...register('name')}
        />
        {formState.errors.name && (
          <p id="register-name-error" role="alert" className="pl-1 text-sm text-accent">
            {t(fieldErrorKey('name', formState.errors.name.type))}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="register-email">
          {t('auth.email')}
        </label>
        <TextField
          id="register-email"
          type="email"
          className="w-full"
          placeholder={t('auth.email')}
          autoComplete="email"
          aria-invalid={formState.errors.email !== undefined}
          aria-describedby={formState.errors.email ? 'register-email-error' : undefined}
          {...register('email')}
        />
        {formState.errors.email && (
          <p id="register-email-error" role="alert" className="pl-1 text-sm text-accent">
            {t(fieldErrorKey('email', formState.errors.email.type))}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="register-password">
          {t('auth.password')}
        </label>
        <PasswordField
          id="register-password"
          className="w-full"
          placeholder={t('auth.password')}
          autoComplete="new-password"
          aria-invalid={formState.errors.password !== undefined}
          aria-describedby={formState.errors.password ? 'register-password-error' : undefined}
          {...register('password')}
        />
        {formState.errors.password && (
          <p id="register-password-error" role="alert" className="pl-1 text-sm text-accent">
            {t(fieldErrorKey('password', formState.errors.password.type))}
          </p>
        )}
      </div>

      {rootError && (
        <p role="alert" className="pl-1 text-sm text-accent">
          {t(rootError)}
        </p>
      )}

      <Button type="submit" disabled={formState.isSubmitting} aria-busy={formState.isSubmitting}>
        {formState.isSubmitting && <Spinner />}
        {t('auth.create_account')}
      </Button>

      {footer && <div className="text-center text-sm">{footer}</div>}
    </form>
  );
}
