import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { signIn } from '@/features/auth';

import { LoginPage } from './login-page';

/** signIn подменяем шпионом поверх реальной реализации: нужен кейс отказа авторизации */
vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth')>();
  return { ...actual, signIn: vi.fn(actual.signIn) };
});

describe('LoginPage', () => {
  it('показывает клиентскую валидацию и не пускает дальше', async () => {
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter an email')).toBeInTheDocument();
    expect(screen.getByText('At least 4 characters')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('входит корректными данными и дергает onSuccess', async () => {
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Email'), 'demo@local.test');
    await userEvent.type(screen.getByLabelText('Password'), 'password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('показывает ошибку отказа авторизации и не пускает дальше', async () => {
    const onSuccess = vi.fn();
    vi.mocked(signIn).mockResolvedValueOnce('auth.errors.invalid_credentials');
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Email'), 'demo@local.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('кнопка-глаз переключает type инпута пароля и свое доступное имя', async () => {
    render(<LoginPage onSuccess={vi.fn()} />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
