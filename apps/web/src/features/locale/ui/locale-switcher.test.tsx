import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';

import { $locale, localeSuggested } from '../model/locale';

import { LocaleSwitcher } from './locale-switcher';

beforeEach(() => {
  localeSuggested('en');
});

it('переключатель показывает целевой язык и меняет его по клику', async () => {
  const user = userEvent.setup();
  render(<LocaleSwitcher />);

  const button = screen.getByRole('button', { name: 'Русский' });
  await user.click(button);

  expect($locale.getState()).toBe('ru');
  expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
});
