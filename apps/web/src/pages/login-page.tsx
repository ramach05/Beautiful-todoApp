import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { type AuthErrorKey, signIn } from '@/features/auth';
import { Button } from '@/shared/ui/button';
import { fieldErrorKey } from '@/shared/i18n';
import { Spinner } from '@/shared/ui/spinner';
import { TextField } from '@/shared/ui/text-field';

// Сообщения не переводим: UI маппит code ошибки zod на ключ словаря через fieldErrorKey
const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(4),
});

type LoginValues = z.infer<typeof loginSchema>;

export interface LoginPageProps {
  onSuccess: () => void;
  /** Ссылка на регистрацию проводится снаружи, чтобы страница не зависела от роутера в тестах */
  footer?: ReactNode;
}

export function LoginPage({ onSuccess, footer }: LoginPageProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const [rootError, setRootError] = useState<AuthErrorKey | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    const failure = await signIn(values.email, values.password);
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
      <h2 className="text-center text-3xl">{t('auth.sign_in')}</h2>
      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="login-email">
          {t('auth.email')}
        </label>
        <TextField
          id="login-email"
          type="email"
          className="w-full"
          placeholder={t('auth.email')}
          autoComplete="email"
          aria-invalid={formState.errors.email !== undefined}
          aria-describedby={formState.errors.email ? 'login-email-error' : undefined}
          {...register('email')}
        />
        {formState.errors.email && (
          <p id="login-email-error" role="alert" className="pl-1 text-sm text-accent">
            {t(fieldErrorKey('email', formState.errors.email.type))}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="login-password">
          {t('auth.password')}
        </label>
        <TextField
          id="login-password"
          type="password"
          className="w-full"
          placeholder={t('auth.password')}
          autoComplete="current-password"
          aria-invalid={formState.errors.password !== undefined}
          aria-describedby={formState.errors.password ? 'login-password-error' : undefined}
          {...register('password')}
        />
        {formState.errors.password && (
          <p id="login-password-error" role="alert" className="pl-1 text-sm text-accent">
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
        {t('auth.sign_in')}
      </Button>
      {footer && <div className="text-center text-sm">{footer}</div>}
    </form>
  );
}
