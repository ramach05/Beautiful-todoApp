import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { RegisterPage } from '../pages/register-page';

function RegisterComponent() {
  const navigate = useNavigate();
  return (
    <RegisterPage
      onSuccess={() => void navigate({ to: '/' })}
      footer={<Link to="/login">Уже есть аккаунт? Войти</Link>}
    />
  );
}

export const Route = createFileRoute('/register')({
  head: () => ({ meta: [{ title: 'Beautiful Todo — регистрация' }] }),
  component: RegisterComponent,
});
