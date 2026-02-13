import { createLazyFileRoute } from '@tanstack/react-router'
import FinancePage from '@/pages/finance/finance-page'

export const Route = createLazyFileRoute('/finance')({
  component: FinancePage,
})

