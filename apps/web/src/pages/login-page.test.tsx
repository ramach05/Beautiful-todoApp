import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { signIn } from '@/features/auth';

import { LoginPage } from './login-page';

/** signIn is replaced with a spy over the real implementation: needed for the auth-rejection case */
vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth')>();
  return { ...actual, signIn: vi.fn(actual.signIn) };
});

describe('LoginPage', () => {
  it('shows validation errors and does not submit', async () => {
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter an email')).toBeInTheDocument();
    expect(screen.getByText('At least 4 characters')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('signs in with valid credentials', async () => {
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Email'), 'demo@local.test');
    await userEvent.type(screen.getByLabelText('Password'), 'password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('shows an error when sign-in is rejected', async () => {
    const onSuccess = vi.fn();
    vi.mocked(signIn).mockResolvedValueOnce('auth.errors.invalid_credentials');
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Email'), 'demo@local.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
