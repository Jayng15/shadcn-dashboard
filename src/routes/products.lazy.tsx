
import { createLazyFileRoute } from '@tanstack/react-router'
import ProductListPage from '@/pages/products/product-list'

export const Route = createLazyFileRoute('/products')({
  component: ProductListPage,
})
