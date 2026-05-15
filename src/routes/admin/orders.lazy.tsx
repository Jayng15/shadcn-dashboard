import { createLazyFileRoute } from '@tanstack/react-router'
import OrderPage from '@/pages/order/order-page'

export const Route = createLazyFileRoute('/admin/orders')({
  component: OrderPage,
})
