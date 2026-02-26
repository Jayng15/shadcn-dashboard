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

export type OrderItem = {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: string
  subtotalAmount: string
  totalLine: string
}

export type Order = {
  id: string
  userId: string
  storeId: string
  orderCode: string
  customerFullName: string
  customerContactPhone: string
  customerEmail: string
  shippingAddress: string
  notes: string | null
  subtotalAmount: string
  shippingFee: string | null
  totalAmount: string
  status: string
  shipmentProvider: string | null
  shipmentCode: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderCode",
    header: "Order Code",
  },
  {
    accessorKey: "userId",
    header: "User ID",
    cell: ({ row }) => {
      const id = row.getValue("userId") as string;
      return <div className="max-w-[100px] truncate" title={id}>{id}</div>
    }
  },
  {
    accessorKey: "storeId",
    header: "Store ID",
    cell: ({ row }) => {
      const id = row.getValue("storeId") as string;
      return <div className="max-w-[100px] truncate" title={id}>{id}</div>
    }
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const amount = Number(row.getValue("totalAmount") as string)
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount)
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "outline"

      switch (status) {
        case "COMPLETED":
          variant = "default"
          break
        case "CANCELLED":
        case "RETURNED":
        case "REFUNDED":
          variant = "destructive"
          break
        case "PENDING":
        case "CONFIRMED":
        case "AWAITING_PAYMENT":
        case "PROCESSING":
          variant = "secondary"
          break
        case "SHIPPED":
        case "IN_TRANSIT":
        case "DELIVERED":
          variant = "default"
          break
        default:
          variant = "outline"
      }

      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string
      return new Date(createdAt).toLocaleString()
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const order = row.original

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
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copy Order ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.orderCode)}
            >
              Copy Order Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as any)?.openOrderDetail?.(order)
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
