import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { signUp } from '@/features/auth';

import { RegisterPage } from './register-page';

/** signUp is replaced with a spy over the real implementation: server rejections need a stubbed outcome */
vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth')>();
  return { ...actual, signUp: vi.fn(actual.signUp) };
});

describe('RegisterPage', () => {
  it('shows validation errors and does not submit', async () => {
    const onSuccess = vi.fn();
    render(<RegisterPage onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Enter a name')).toBeInTheDocument();
    expect(screen.getByText('Enter an email')).toBeInTheDocument();
    expect(screen.getByText('At least 4 characters')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('signs up with valid data', async () => {
    const onSuccess = vi.fn();
    render(<RegisterPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'register@test.local');
    await userEvent.type(screen.getByLabelText('Password'), 'password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('shows the server rejection under the password', async () => {
    const onSuccess = vi.fn();
    vi.mocked(signUp).mockResolvedValueOnce('auth.errors.email_exists');
    render(<RegisterPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'taken@test.local');
    await userEvent.type(screen.getByLabelText('Password'), 'password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
