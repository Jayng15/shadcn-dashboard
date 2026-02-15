import { createRootRoute, redirect } from '@tanstack/react-router'
import MainLayout from '@/layouts/main-layout'
import NotFoundPage from '@/pages/not-found'
import api from '@/lib/api'


export const Route = createRootRoute({
  component: MainLayout,
  notFoundComponent: NotFoundPage,
  beforeLoad: async ({ location }) => {
    // Allow access to login page without check
    // Using includes to catch both /login and potentially /admin/login if base path exists
    if (location.pathname.includes('/login')) {
      return
    }

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      });
    }

    try {
      // Always fetch fresh user info to validate session and role
      const res = await api.get('/auth/info');
      const user = res.data.user;

      if (!user || user.role !== 'ADMIN') {
        throw new Error("Unauthorized: Role is not ADMIN");
      }

      // Update local storage with fresh data
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');

    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Redirect to login if check fails
      throw redirect({
        to: '/login',
      });
    }
  }
})
