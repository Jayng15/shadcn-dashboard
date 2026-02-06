
import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '@/pages/auth/login'
import AuthLayout from '@/layouts/auth-layout'

export const Route = createFileRoute('/login')({
  component: () => (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  ),
  beforeLoad: () => {
      if (localStorage.getItem('isAuthenticated') === 'true') {
          throw redirect({ to: '/' })
      }
  }
})
