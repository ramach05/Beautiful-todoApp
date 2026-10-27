import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signUp } from '@/features/auth';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import { TextField } from '@/shared/ui/text-field';

const registerSchema = z.object({
  name: z.string().min(2, 'Enter a name'),
  email: z.email('Enter an email'),
  password: z.string().min(4, 'At least 4 characters'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export interface RegisterPageProps {
  onSuccess: () => void;
  /** Ссылка на вход проводится снаружи, чтобы страница не зависела от роутера в тестах */
  footer?: ReactNode;
}

export function RegisterPage({ onSuccess, footer }: RegisterPageProps) {
  const { register, handleSubmit, setError, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const failure = await signUp(values.email, values.password);
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
      <h2 className="text-center text-3xl">Sign up</h2>

      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="register-name">
          Name
        </label>
        <TextField
          id="register-name"
          type="text"
          className="w-full"
          placeholder="Name"
          autoComplete="name"
          aria-invalid={formState.errors.name !== undefined}
          aria-describedby={formState.errors.name ? 'register-name-error' : undefined}
          {...register('name')}
        />
        {formState.errors.name && (
          <p id="register-name-error" role="alert" className="pl-1 text-sm text-accent">
            {formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="register-email">
          Email
        </label>
        <TextField
          id="register-email"
          type="email"
          className="w-full"
          placeholder="Email"
          autoComplete="email"
          aria-invalid={formState.errors.email !== undefined}
          aria-describedby={formState.errors.email ? 'register-email-error' : undefined}
          {...register('email')}
        />
        {formState.errors.email && (
          <p id="register-email-error" role="alert" className="pl-1 text-sm text-accent">
            {formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="register-password">
          Password
        </label>
        <TextField
          id="register-password"
          type="password"
          className="w-full"
          placeholder="Password"
          autoComplete="new-password"
          aria-invalid={formState.errors.password !== undefined}
          aria-describedby={formState.errors.password ? 'register-password-error' : undefined}
          {...register('password')}
        />
        {formState.errors.password && (
          <p id="register-password-error" role="alert" className="pl-1 text-sm text-accent">
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
        Create account
      </Button>

      {footer && <div className="text-center text-sm">{footer}</div>}
    </form>
  );
}
