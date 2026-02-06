import { createRootRoute, redirect } from '@tanstack/react-router'
import MainLayout from '@/layouts/main-layout'
import NotFoundPage from '@/pages/not-found'


export const Route = createRootRoute({
  component: MainLayout,
  notFoundComponent: NotFoundPage,
  beforeLoad: ({ location }) => {
    // If not logged in and trying to access something other than login
    if (localStorage.getItem('isAuthenticated') !== 'true' && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
      })
    }
  }
})
