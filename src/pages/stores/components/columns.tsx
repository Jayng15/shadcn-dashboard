
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import api from "@/lib/api"

export type Store = {
  id: string
  userId: string
  name: string
  ownerName: string
  contactPhone: string
  contactEmail: string
  status: "REQUESTED" | "ACTIVE" | "REJECTED" | "BANNED"
  isVerified: boolean
  createdAt: string
}

export interface StoreTableMeta {
  refetch: () => void;
  openStoreDetail?: (store: Store) => void;
  openStoreReviews?: (store: Store) => void;
  openStoreReports?: (store: Store) => void;
}

// Helper functions (outside component to avoid recreation, passing tableMeta)
const verifyStore = async (id: string, tableMeta?: StoreTableMeta) => {
    try {
        await api.post(`/store/${id}/verify`);
        toast.success("Đã xác minh cửa hàng");
        tableMeta?.refetch();
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Xác minh thất bại");
    }
}

const updateStoreStatus = async (id: string, status: string, tableMeta?: StoreTableMeta) => {
    try {
        await api.patch(`/store/${id}/status`, { status });
        toast.success(`Cập nhật trạng thái thành: ${status}`);
        tableMeta?.refetch();
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
}

export const columns: ColumnDef<Store>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tên cửa hàng
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-bold pl-4">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "ownerName",
    header: "Chủ cửa hàng",
  },
  {
    accessorKey: "contactPhone",
    header: "Số điện thoại",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
            <Badge variant={
                status === 'ACTIVE' ? 'default' : 
                status === 'REQUESTED' ? 'secondary' : 
                'destructive'
            }>
                {status === 'ACTIVE' ? 'Hoạt động' : 
                 status === 'REQUESTED' ? 'Chờ duyệt' : 
                 status === 'REJECTED' ? 'Từ chối' : status}
            </Badge>
        )
    }
  },
  {
    accessorKey: "isVerified",
    header: "Xác minh",
    cell: ({ row }) => {
        const isVerified = row.getValue("isVerified") as boolean
        return isVerified ? <Badge variant="outline" className="border-green-500 text-green-500">Đã xác minh</Badge> : <span className="text-muted-foreground text-sm font-medium">Chưa</span>
    }
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const store = row.original
      const meta = table.options.meta as StoreTableMeta

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
              onClick={() => navigator.clipboard.writeText(store.id)}
            >
              Sao chép ID Cửa hàng
            </DropdownMenuItem>
             <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(store.userId)}
            >
              Sao chép ID Người dùng
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                meta?.openStoreDetail?.(store)
              }
            >
              Xem thông tin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                meta?.openStoreReviews?.(store)
              }
            >
              Xem đánh giá
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                meta?.openStoreReports?.(store)
              }
            >
              Xem báo cáo
            </DropdownMenuItem>

            {/* Admin Actions */}
            <DropdownMenuSeparator />

            {!store.isVerified && (
                 <DropdownMenuItem onClick={async () => {
                    await verifyStore(row.original.id, meta);
                 }}>
                    Xác minh cửa hàng
                 </DropdownMenuItem>
            )}

            {store.status === 'REQUESTED' && (
                 <>
                     <DropdownMenuItem onClick={async () => {
                         await updateStoreStatus(row.original.id, 'ACTIVE', meta);
                     }}>
                         Phê duyệt (Kích hoạt)
                     </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                         await updateStoreStatus(row.original.id, 'REJECTED', meta);
                     }} className="text-red-500">
                         Từ chối
                     </DropdownMenuItem>
                 </>
            )}

            {store.status === 'ACTIVE' && (
                 <DropdownMenuItem onClick={async () => {
                    await updateStoreStatus(row.original.id, 'BANNED', meta);
                 }} className="text-red-500">
                    Cấm cửa hàng
                 </DropdownMenuItem>
            )}

             {store.status === 'BANNED' && (
                 <DropdownMenuItem onClick={async () => {
                    await updateStoreStatus(row.original.id, 'ACTIVE', meta);
                 }}>
                    Bỏ cấm (Kích hoạt)
                 </DropdownMenuItem>
            )}

          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
