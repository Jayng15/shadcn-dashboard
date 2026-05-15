import { createLazyFileRoute } from '@tanstack/react-router'
import TeamDetailPage from '@/pages/idol/team-detail'

export const Route = createLazyFileRoute('/admin/idols/$teamId')({
  component: TeamDetailPage,
})
