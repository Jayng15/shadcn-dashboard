
import { createLazyFileRoute } from '@tanstack/react-router'
import StoreDetailPage from '@/pages/stores/store-detail'

export const Route = createLazyFileRoute('/stores/$storeId')({
  component: StoreDetailPage,
})
