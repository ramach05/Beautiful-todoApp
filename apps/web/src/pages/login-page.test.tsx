import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from './login-page';

describe('LoginPage', () => {
  it('показывает клиентскую валидацию и не пускает дальше', async () => {
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Укажите email')).toBeInTheDocument();
    expect(screen.getByText('Минимум 8 символов')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('входит корректными данными и дергает onSuccess', async () => {
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('Email'), 'demo@local.test');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
