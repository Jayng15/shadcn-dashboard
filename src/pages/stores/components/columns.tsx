
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
        toast.success("Store verified");
        tableMeta?.refetch();
    } catch (e: any) {
        toast.error("Failed to verify store");
    }
};

const updateStoreStatus = async (id: string, status: 'ACTIVE' | 'BANNED' | 'REJECTED' | 'REQUESTED', tableMeta: any) => {
    try {
        await api.patch(`/store/${id}/status`, { status });
        toast.success(`Store status updated to ${status}`);
        tableMeta?.refetch();
    } catch (e: any) {
        toast.error("Failed to update status");
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
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "userId",
    header: "User ID",
    cell: ({ row }) => <div className="max-w-[100px] truncate" title={row.getValue("userId")}>{row.getValue("userId")}</div>
  },
  {
      accessorKey: "contactPhone",
      header: "Phone",
      cell: ({ row }) => row.getValue("contactPhone") || "N/A"
  },
  {
      accessorKey: "contactEmail",
      header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline"

      switch(status) {
          case 'ACTIVE': variant = 'default'; break;
          case 'REQUESTED': variant = 'secondary'; break;
          case 'BANNED': variant = 'destructive'; break;
          case 'REJECTED': variant = 'destructive'; break;
      }

      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "isVerified",
    header: "Verified",
    cell: ({ row }) => {
        const isVerified = row.getValue("isVerified") as boolean
        return isVerified ? <Badge variant="outline" className="border-green-500 text-green-500">Yes</Badge> : <span className="text-muted-foreground text-sm">No</span>
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(store.id)}
            >
              Copy Store ID
            </DropdownMenuItem>
             <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(store.userId)}
            >
              Copy User ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                (meta as any)?.openStoreDetail?.(store)
              }
            >
              View Details
            </DropdownMenuItem>

            {/* Admin Actions */}
            <DropdownMenuSeparator />

            {!store.isVerified && (
                 <DropdownMenuItem onClick={() => verifyStore(store.id, meta)}>
                    Verify Store
                 </DropdownMenuItem>
            )}

            {store.status === 'REQUESTED' && (
                <>
                    <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'ACTIVE', meta)}>
                        Approve (Activate)
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'REJECTED', meta)} className="text-red-500">
                        Reject
                    </DropdownMenuItem>
                </>
            )}

            {store.status === 'ACTIVE' && (
                 <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'BANNED', meta)} className="text-red-500">
                    Ban Store
                 </DropdownMenuItem>
            )}

             {store.status === 'BANNED' && (
                 <DropdownMenuItem onClick={() => updateStoreStatus(store.id, 'ACTIVE', meta)}>
                    Unban (Activate)
                 </DropdownMenuItem>
            )}

          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
