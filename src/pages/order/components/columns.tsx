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
    header: "Mã đơn hàng",
  },
  {
    accessorKey: "customerFullName",
    header: "Tên khách hàng",
  },
  {
    accessorKey: "storeId",
    header: "Mã cửa hàng",
    cell: ({ row }) => {
      const id = row.getValue("storeId") as string;
      return <div className="max-w-[100px] truncate" title={id}>{id}</div>
    }
  },
  {
    accessorKey: "totalAmount",
    header: "Tổng cộng",
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
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "outline"

      const statusLabels: Record<string, string> = {
        PENDING: "Chờ xử lý",
        CONFIRMED: "Đã xác nhận",
        AWAITING_PAYMENT: "Chờ thanh toán",
        PROCESSING: "Đang chuẩn bị",
        SHIPPED: "Đang giao hàng",
        IN_TRANSIT: "Đang vận chuyển",
        DELIVERED: "Đã giao hàng",
        COMPLETED: "Hoàn thành",
        CANCELLED: "Đã hủy",
        RETURNED: "Đã trả hàng",
        REFUNDED: "Đã hoàn tiền",
      }

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

      return <Badge variant={variant}>{statusLabels[status] || status}</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string
      return new Date(createdAt).toLocaleString()
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Cập nhật",
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as string
      return new Date(updatedAt).toLocaleString()
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
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Sao chép ID đơn hàng
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.orderCode)}
            >
              Sao chép mã đơn hàng
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as any)?.openOrderDetail?.(order)
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
