
import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '@/pages/auth/login'
import AuthLayout from '@/layouts/auth-layout'

export const Route = createFileRoute('/login')({
  component: () => (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  ),
  beforeLoad: async () => {
      // Intentionally empty.
      // We rely on root guard to redirect authorized users AWAY from login if needed.
  }
})
