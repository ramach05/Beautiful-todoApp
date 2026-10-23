import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { LoginPage } from '@/pages/login-page';

function LoginComponent() {
  const navigate = useNavigate();
  return (
    <LoginPage
      onSuccess={() => void navigate({ to: '/' })}
      footer={<Link to="/register">No account? Sign up</Link>}
    />
  );
}

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Beautiful Todo — Sign in' }] }),
  component: LoginComponent,
});
