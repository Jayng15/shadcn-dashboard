import { createLazyFileRoute } from '@tanstack/react-router'
import FinancePage from '@/pages/finance/finance-page'

export const Route = createLazyFileRoute('/admin/finance')({
  component: FinancePage,
})

