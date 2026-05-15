import { createLazyFileRoute } from '@tanstack/react-router'
import CalendarPage from '@/pages/calendar'

export const Route = createLazyFileRoute('admin/calendar')({
  component: CalendarPage,
})
