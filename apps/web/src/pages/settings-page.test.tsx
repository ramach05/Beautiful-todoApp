import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { changeAccountEmail, deleteAccount, sessionFetched } from '@/features/auth';

import { SettingsPage } from './settings-page';

const navigate = vi.fn();

// The page redirects through the router after leave-app actions: a spy replaces the hook
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth')>();
  return {
    ...actual,
    changeAccountEmail: vi.fn(actual.changeAccountEmail),
    deleteAccount: vi.fn(actual.deleteAccount),
  };
});

describe('SettingsPage', () => {
  beforeEach(() => {
    navigate.mockReset();
    sessionFetched({ user: { id: 'u-1', email: 'me@test.local', locale: 'en' } });
  });

  it('renders the account sections for the signed-in user', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('me@test.local')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Change email' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete account' })).toBeInTheDocument();
  });

  it('shows a confirmation banner after a successful email change', async () => {
    vi.mocked(changeAccountEmail).mockResolvedValueOnce({
      ok: true,
      message: 'auth.account.email_updated',
    });
    render(<SettingsPage />);

    await userEvent.type(screen.getByLabelText('New email'), 'new@test.local');
    await userEvent.click(screen.getByRole('button', { name: 'Update email' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Email updated');
    expect(changeAccountEmail).toHaveBeenCalledWith('new@test.local');
  });

  it('asks for confirmation before deleting and leaves for login after it', async () => {
    vi.mocked(deleteAccount).mockResolvedValueOnce({ ok: true });
    render(<SettingsPage />);

    await userEvent.type(screen.getByLabelText('Confirm password'), 'password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));

    expect(await screen.findByRole('heading', { name: 'Delete account?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith('password-123'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/login' }));
  });
});
