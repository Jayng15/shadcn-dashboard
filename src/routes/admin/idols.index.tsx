import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const idolSearchSchema = z.object({
  page: z.number().catch(0),
  pageSize: z.number().catch(10),
})

export type IdolSearch = z.infer<typeof idolSearchSchema>

export const Route = createFileRoute('idols/')({
  validateSearch: (search) => idolSearchSchema.parse(search),
})
