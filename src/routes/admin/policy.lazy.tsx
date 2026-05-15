import { createLazyFileRoute } from '@tanstack/react-router'
import PolicyPage from '@/pages/policy/policy-page'

export const Route = createLazyFileRoute('/admin/policy')({
  component: PolicyPage,
})
