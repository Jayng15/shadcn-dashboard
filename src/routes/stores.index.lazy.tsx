
import { createLazyFileRoute } from '@tanstack/react-router'
import StoreListPage from '@/pages/stores/store-list'

export const Route = createLazyFileRoute('/stores')({
  component: StoreListPage,
})
