import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signIn } from '@/features/auth';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import { TextField } from '@/shared/ui/text-field';

const loginSchema = z.object({
  email: z.email('Enter an email'),
  password: z.string().min(4, 'At least 4 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

export interface LoginPageProps {
  onSuccess: () => void;
  /** Ссылка на регистрацию проводится снаружи, чтобы страница не зависела от роутера в тестах */
  footer?: ReactNode;
}

export function LoginPage({ onSuccess, footer }: LoginPageProps) {
  const { register, handleSubmit, setError, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const failure = await signIn(values.email, values.password);
    if (failure) {
      setError('root', { message: failure });
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
      <h2 className="text-center text-3xl">Sign in</h2>
      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="login-email">
          Email
        </label>
        <TextField
          id="login-email"
          type="email"
          className="w-full"
          placeholder="Email"
          autoComplete="email"
          aria-invalid={formState.errors.email !== undefined}
          aria-describedby={formState.errors.email ? 'login-email-error' : undefined}
          {...register('email')}
        />
        {formState.errors.email && (
          <p id="login-email-error" role="alert" className="pl-1 text-sm text-accent">
            {formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="login-password">
          Password
        </label>
        <TextField
          id="login-password"
          type="password"
          className="w-full"
          placeholder="Password"
          autoComplete="current-password"
          aria-invalid={formState.errors.password !== undefined}
          aria-describedby={formState.errors.password ? 'login-password-error' : undefined}
          {...register('password')}
        />
        {formState.errors.password && (
          <p id="login-password-error" role="alert" className="pl-1 text-sm text-accent">
            {formState.errors.password.message}
          </p>
        )}
      </div>
      {formState.errors.root && (
        <p role="alert" className="pl-1 text-sm text-accent">
          {formState.errors.root.message}
        </p>
      )}
      <Button type="submit" disabled={formState.isSubmitting} aria-busy={formState.isSubmitting}>
        {formState.isSubmitting && <Spinner />}
        Sign in
      </Button>
      {footer && <div className="text-center text-sm">{footer}</div>}
    </form>
  );
}
