import { createLazyFileRoute } from '@tanstack/react-router'
import FaqPage from '@/pages/faq/faq-page'

export const Route = createLazyFileRoute('/admin/faq')({
  component: FaqPage,
})
