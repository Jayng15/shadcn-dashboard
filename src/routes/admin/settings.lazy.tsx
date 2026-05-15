import { createLazyFileRoute } from '@tanstack/react-router'
import SettingsPage from '@/pages/settings/settings-page'

export const Route = createLazyFileRoute('/admin/settings')({
  component: SettingsPage,
})
