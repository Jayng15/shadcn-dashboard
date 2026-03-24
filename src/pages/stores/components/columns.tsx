
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

// Define the shape of our Store data
// Define the shape of our Store data
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

// Helper functions (outside component to avoid recreation, passing tableMeta)
const verifyStore = async (id: string, tableMeta: any) => {
    try {
        await api.post(`/store/${id}/verify`);
        toast.success("Đã xác minh cửa hàng");
        tableMeta?.refetch();
    } catch (e: any) {
        toast.error("Không thể xác minh cửa hàng");
    }
};

const updateStoreStatus = async (id: string, status: 'ACTIVE' | 'BANNED' | 'REJECTED' | 'REQUESTED', tableMeta: any) => {
    try {
        await api.patch(`/store/${id}/status`, { status });
        const statusMap = {
            ACTIVE: "Đang hoạt động",
            BANNED: "Đã bị cấm",
            REJECTED: "Đã từ chối",
            REQUESTED: "Đang chờ duyệt"
        };
        toast.success(`Đã cập nhật trạng thái cửa hàng thành ${statusMap[status]}`);
        tableMeta?.refetch();
    } catch (e: any) {
        toast.error("Không thể cập nhật trạng thái");
    }
};

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
  },
  {
    accessorKey: "userId",
    header: "ID Người dùng",
    cell: ({ row }) => <div className="max-w-[100px] truncate" title={row.getValue("userId")}>{row.getValue("userId")}</div>
  },
  {
      accessorKey: "contactPhone",
      header: "Điện thoại",
      cell: ({ row }) => row.getValue("contactPhone") || "Chưa có"
  },
  {
      accessorKey: "contactEmail",
      header: "Email",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
      let label = status

      switch(status) {
          case 'ACTIVE': variant = 'default'; label = "Đang hoạt động"; break;
          case 'REQUESTED': variant = 'secondary'; label = "Chờ duyệt"; break;
          case 'BANNED': variant = 'destructive'; label = "Đã cấm"; break;
          case 'REJECTED': variant = 'destructive'; label = "Từ chối"; break;
      }

      return <Badge variant={variant}>{label}</Badge>
    },
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
      const meta = table.options.meta

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
                (meta as any)?.openStoreDetail?.(store)
              }
            >
              Xem thông tin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (meta as any)?.openStoreReviews?.(store)
              }
            >
              Xem đánh giá
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (meta as any)?.openStoreReports?.(store)
              }
            >
              Xem báo cáo
            </DropdownMenuItem>

            {/* Admin Actions */}
            <DropdownMenuSeparator />

            {!store.isVerified && (
                 <DropdownMenuItem onClick={() => verifyStore(store.id, meta)}>
                    Xác minh cửa hàng
                 </DropdownMenuItem>
            )}

            {store.status === 'REQUESTED' && (
                <>
                    <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'ACTIVE', meta)}>
                        Phê duyệt (Kích hoạt)
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'REJECTED', meta)} className="text-red-500">
                        Từ chối
                    </DropdownMenuItem>
                </>
            )}

            {store.status === 'ACTIVE' && (
                 <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'BANNED', meta)} className="text-red-500">
                    Cấm cửa hàng
                 </DropdownMenuItem>
            )}

             {store.status === 'BANNED' && (
                 <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'ACTIVE', meta)}>
                    Bỏ cấm (Kích hoạt)
                 </DropdownMenuItem>
            )}

          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
