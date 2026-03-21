import { createLazyFileRoute } from '@tanstack/react-router'
import FaqPage from '@/pages/faq/faq-page'

export const Route = createLazyFileRoute('/faq')({
  component: FaqPage,
})
