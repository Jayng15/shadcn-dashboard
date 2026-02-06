import { createRootRoute, redirect } from '@tanstack/react-router'
import MainLayout from '@/layouts/main-layout'
import NotFoundPage from '@/pages/not-found'


export const Route = createRootRoute({
  component: MainLayout,
  notFoundComponent: NotFoundPage,
  beforeLoad: ({ location }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isAuthenticated && user?.role !== 'ADMIN' && location.pathname !== '/login') {
         // Invalid role, clear and redirect
         localStorage.removeItem('isAuthenticated');
         localStorage.removeItem('user');
         throw redirect({ to: '/login' });
    }

    // If not logged in and trying to access something other than login
    if (!isAuthenticated && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
      })
    }
  }
})
