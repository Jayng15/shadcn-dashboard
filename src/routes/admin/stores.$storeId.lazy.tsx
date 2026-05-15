
import { createLazyFileRoute } from '@tanstack/react-router'
import StoreDetailPage from '@/pages/stores/store-detail'

export const Route = createLazyFileRoute('/admin/stores/$storeId')({
  component: StoreDetailPage,
})
