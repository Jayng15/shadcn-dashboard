import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type FinanceTransaction = {
  id: string
  accountId: string
  userId: string
  amount: string
  currency: string
  status: string
  type: "DEPOSIT" | "WITHDRAW"
  txCode: string
  balanceAfter: string
  paymentMethod: string
  txProofUrl: string | null
  costPrice: string
  description: string
  bankAccountNumber: string | null
  bankName: string | null
  bankAccountOwner: string | null
  txAt: string
  verifiedStatus: string
  verifiedAt: string | null
  createdAt: string
}

export const columns: ColumnDef<FinanceTransaction>[] = [
  {
    accessorKey: "txCode",
    header: "Tx Code",
  },
  {
    accessorKey: "userId",
    header: "User ID",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as FinanceTransaction["type"]
      const variant =
        type === "DEPOSIT" ? "default" : ("destructive" as const)
      return <Badge variant={variant}>{type}</Badge>
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = Number(row.getValue("amount") as string)
      const currency = row.original.currency
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
      }).format(amount)
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Method",
  },
  {
    accessorKey: "verifiedStatus",
    header: "Verified",
    cell: ({ row }) => {
      const status = row.getValue("verifiedStatus") as string
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "outline"

      switch (status) {
        case "VERIFIED":
          variant = "default"
          break
        case "PENDING":
          variant = "secondary"
          break
        default:
          variant = "outline"
      }

      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "txAt",
    header: "Date",
    cell: ({ row }) => {
      const txAt = row.getValue("txAt") as string
      return new Date(txAt).toLocaleString()
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const tx = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tx.id)}
            >
              Copy Tx ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tx.txCode)}
            >
              Copy Tx Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as any)?.openFinanceDetail?.(tx)
              }
            >
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

