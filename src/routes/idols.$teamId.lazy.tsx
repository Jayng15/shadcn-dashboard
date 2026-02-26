import { createLazyFileRoute } from '@tanstack/react-router'
import TeamDetailPage from '@/pages/idol/team-detail'

export const Route = createLazyFileRoute('/idols/$teamId')({
  component: TeamDetailPage,
})
