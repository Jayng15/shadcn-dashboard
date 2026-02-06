
import { createLazyFileRoute } from '@tanstack/react-router'
import UserDetailPage from '@/pages/users/user-detail'

export const Route = createLazyFileRoute('/users/$userId')({
  component: UserDetailPage,
})
