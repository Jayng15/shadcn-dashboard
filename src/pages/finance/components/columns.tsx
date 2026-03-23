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
  orderId?: string | null
  amount: string
  currency: string
  status: string
  type: "DEPOSIT" | "WITHDRAW" | "PURCHASE" | "REFUND"
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

export interface FinanceTableMeta {
  refetch: () => void
  userMap?: Record<string, string>
  openFinanceDetail?: (tx: FinanceTransaction) => void
}

export const columns: ColumnDef<FinanceTransaction>[] = [
  {
    accessorKey: "txCode",
    header: "Mã giao dịch",
  },
  {
    accessorKey: "userId",
    header: "Người dùng",
    cell: ({ row, table }) => {
      const userId = row.getValue("userId") as string
      const userMap = (table.options.meta as FinanceTableMeta)?.userMap
      return userMap?.[userId] || userId
    },
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.getValue("type") as FinanceTransaction["type"]
      const orderId = row.original.orderId
      const label = (() => {
        if (type === "DEPOSIT" && orderId) return "Doanh thu"
        switch (type) {
          case "DEPOSIT": return "Nạp tiền"
          case "WITHDRAW": return "Rút tiền"
          case "PURCHASE": return "Thanh toán"
          case "REFUND": return "Hoàn tiền"
          default: return type
        }
      })()
      const variant = (type === "DEPOSIT" || type === "REFUND") ? "default" : ("destructive" as const)
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: "amount",
    header: "Số tiền",
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
    header: "Phương thức",
  },
  {
    accessorKey: "verifiedStatus",
    header: "Xác minh",
    cell: ({ row }) => {
      const status = row.getValue("verifiedStatus") as string
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "outline"
      let label = status
      switch (status) {
        case "VERIFIED":
          variant = "default"
          label = "Đã xác minh"
          break
        case "PENDING":
          variant = "secondary"
          label = "Chờ xử lý"
          break
        default:
          variant = "outline"
      }

      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: "txAt",
    header: "Ngày",
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
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tx.id)}
            >
              Sao chép ID giao dịch
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tx.txCode)}
            >
              Sao chép mã giao dịch
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as FinanceTableMeta)?.openFinanceDetail?.(tx)
              }
            >
              Xem chi tiết
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

