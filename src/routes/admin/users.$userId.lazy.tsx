
import { createLazyFileRoute } from '@tanstack/react-router'
import UserDetailPage from '@/pages/users/user-detail'

export const Route = createLazyFileRoute('/admin/users/$userId')({
  component: UserDetailPage,
})
