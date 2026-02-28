import { createLazyFileRoute } from '@tanstack/react-router'
import IdolListPage from '@/pages/idol/idol-list'

export const Route = createLazyFileRoute('/idols/')({
  component: IdolListPage,
})
