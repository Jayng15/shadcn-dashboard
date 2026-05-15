import TaskPage from '@/pages/task'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/admin/task')({
  component: TaskPage,
})
