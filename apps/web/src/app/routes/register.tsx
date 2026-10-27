import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { RegisterPage } from '@/pages/register-page';

function RegisterComponent() {
  const navigate = useNavigate();
  return (
    <RegisterPage
      onSuccess={() => void navigate({ to: '/' })}
      footer={
        <Link className="nav-link focus-ring rounded" to="/login">
          Already have an account? Sign in
        </Link>
      }
    />
  );
}

export const Route = createFileRoute('/register')({
  head: () => ({ meta: [{ title: 'Beautiful Todo — Sign up' }] }),
  component: RegisterComponent,
});
