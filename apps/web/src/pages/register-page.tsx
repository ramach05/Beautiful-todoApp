import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signUp } from '@/features/auth';

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

  const inputClass =
    'w-full rounded-[10px] bg-card-strong px-3 py-2 text-lg ring-1 ring-ring-soft ' +
    'placeholder:text-gray-400 focus:ring-white focus:outline-none';

  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-3 pt-6"
      onSubmit={(event) => void onSubmit(event)}
    >
      <h2 className="text-center text-3xl">Sign up</h2>
      <input
        type="text"
        className={inputClass}
        placeholder="Name"
        aria-label="Name"
        autoComplete="name"
        aria-invalid={formState.errors.name !== undefined}
        {...register('name')}
      />
      {formState.errors.name && (
        <p role="alert" className="-mt-2 pl-1 text-sm text-accent">
          {formState.errors.name.message}
        </p>
      )}
      <input
        type="email"
        className={inputClass}
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        aria-invalid={formState.errors.email !== undefined}
        {...register('email')}
      />
      {formState.errors.email && (
        <p role="alert" className="-mt-2 pl-1 text-sm text-accent">
          {formState.errors.email.message}
        </p>
      )}
      <input
        type="password"
        className={inputClass}
        placeholder="Password"
        aria-label="Password"
        autoComplete="new-password"
        aria-invalid={formState.errors.password !== undefined}
        {...register('password')}
      />
      {formState.errors.password && (
        <p role="alert" className="-mt-2 pl-1 text-sm text-accent">
          {formState.errors.password.message}
        </p>
      )}
      {formState.errors.root && (
        <p role="alert" className="pl-1 text-sm text-accent">
          {formState.errors.root.message}
        </p>
      )}
      <button
        type="submit"
        className="rounded-[10px] bg-card-strong px-3 py-2 text-lg ring-1 ring-accent-soft transition-colors hover:bg-ring-soft disabled:opacity-40"
        disabled={formState.isSubmitting}
      >
        Create account
      </button>
      {footer && <div className="text-center text-sm">{footer}</div>}
    </form>
  );
}
