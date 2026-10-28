import { useNavigate } from '@tanstack/react-router';
import { useUnit } from 'effector-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type AccountResult,
  $session,
  changeAccountEmail,
  changeAccountPassword,
  deleteAccount,
  signOutEverywhere,
} from '@/features/auth';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field-error';
import { Modal } from '@/shared/ui/modal';
import { PasswordField } from '@/shared/ui/password-field';
import { Spinner } from '@/shared/ui/spinner';
import { TextField } from '@/shared/ui/text-field';

type ActionKey = 'email' | 'password' | 'revoke' | 'delete';
type Feedback = { tone: 'ok' | 'err'; text: string };

/**
 * Скрытое поле логина для форм с паролем: браузерные менеджеры паролей
 * иначе предупреждают, что форме не хватает username.
 */
function HiddenUsername({ email }: { email: string }) {
  return (
    <input
      type="text"
      autoComplete="username"
      value={email}
      readOnly
      tabIndex={-1}
      aria-hidden
      className="sr-only"
    />
  );
}

/**
 * Настройки аккаунта: смена email/пароля, выход на всех устройствах, удаление аккаунта.
 * В демо-режиме действия честно возвращают недоступность вместо падения.
 */
export function SettingsPage() {
  const { t } = useTranslation();
  const session = useUnit($session);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [password, setPassword] = useState('');

  const [pending, setPending] = useState<ActionKey | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ActionKey, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function run(key: ActionKey, action: () => Promise<AccountResult>, leaveApp = false) {
    setPending(key);
    setFeedback(null);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    const result = await action();
    setPending(null);
    if (result.ok) {
      setFeedback({ tone: 'ok', text: t(result.message ?? 'settings.done') });
      if (leaveApp) await navigate({ to: '/login' });
    } else if (key === 'revoke') {
      // У выхода на всех устройствах нет инпутов: ошибка остается в верхнем баннере
      setFeedback({ tone: 'err', text: t(result.error) });
    } else {
      setErrors((prev) => ({ ...prev, [key]: t(result.error) }));
    }
  }

  const busy = (key: ActionKey) => pending === key;
  const disabled = pending !== null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h2 className="text-3xl">{t('settings.title')}</h2>

      <p className="text-lg text-gray-300">
        {t('settings.signed_in_as')}{' '}
        <span className="text-white">{session?.user.email ?? '—'}</span>
      </p>

      {feedback && (
        <p
          role={feedback.tone === 'err' ? 'alert' : 'status'}
          className={
            feedback.tone === 'err'
              ? 'msg-in rounded-[10px] bg-card-strong px-3 py-2 text-accent ring-1 ring-ring-soft'
              : 'msg-in rounded-[10px] bg-card-strong px-3 py-2 text-gray-300 ring-1 ring-ring-soft'
          }
        >
          {feedback.text}
        </p>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="settings-email">
        <h3 id="settings-email" className="text-xl">
          {t('settings.change_email')}
        </h3>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run('email', () => changeAccountEmail(email));
          }}
        >
          <TextField
            type="email"
            className="w-full"
            placeholder={t('settings.new_email')}
            aria-label={t('settings.new_email')}
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby="settings-email-error"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError id="settings-email-error" message={errors.email} />
          <Button type="submit" disabled={disabled} aria-busy={busy('email')}>
            {busy('email') && <Spinner />}
            {t('settings.update_email')}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="settings-password">
        <h3 id="settings-password" className="text-xl">
          {t('settings.change_password')}
        </h3>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run('password', () => changeAccountPassword(currentPassword, newPassword));
          }}
        >
          <HiddenUsername email={session?.user.email ?? ''} />
          <PasswordField
            className="w-full"
            placeholder={t('settings.current_password')}
            aria-label={t('settings.current_password')}
            autoComplete="current-password"
            aria-invalid={errors.password !== undefined}
            aria-describedby="settings-current-password-error"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <FieldError id="settings-current-password-error" message={errors.password} />
          <PasswordField
            className="w-full"
            placeholder={t('settings.new_password')}
            aria-label={t('settings.new_password')}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Button type="submit" disabled={disabled} aria-busy={busy('password')}>
            {busy('password') && <Spinner />}
            {t('settings.change_password')}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="settings-sessions">
        <h3 id="settings-sessions" className="text-xl">
          {t('settings.sessions')}
        </h3>
        <Button
          variant="ghost"
          disabled={disabled}
          aria-busy={busy('revoke')}
          onClick={() => void run('revoke', signOutEverywhere, true)}
        >
          {busy('revoke') && <Spinner />}
          {t('settings.sign_out_everywhere')}
        </Button>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="settings-delete">
        <h3 id="settings-delete" className="text-xl">
          {t('settings.delete_account')}
        </h3>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmDelete(true);
          }}
        >
          <HiddenUsername email={session?.user.email ?? ''} />
          <PasswordField
            className="w-full"
            placeholder={t('settings.confirm_placeholder')}
            aria-label={t('settings.confirm_aria')}
            autoComplete="current-password"
            aria-invalid={errors.delete !== undefined}
            aria-describedby="settings-delete-password-error"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError id="settings-delete-password-error" message={errors.delete} />
          <Button
            variant="danger"
            type="submit"
            disabled={disabled || !password}
            aria-busy={busy('delete')}
          >
            {busy('delete') && <Spinner />}
            {t('settings.delete_account')}
          </Button>
        </form>
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t('settings.delete_confirm_title')}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                {t('settings.delete_cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmDelete(false);
                  void run('delete', () => deleteAccount(password), true);
                }}
              >
                {t('settings.delete_confirm_action')}
              </Button>
            </>
          }
        >
          <p>
            {t('settings.delete_confirm_text', {
              email: session?.user.email ?? '—',
            })}
          </p>
        </Modal>
      </section>
    </div>
  );
}
