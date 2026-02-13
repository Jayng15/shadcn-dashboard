
import { ColumnDef } from "@tanstack/react-table"
import DataTableColumnHeader from "./column-header"
import { Badge } from "@/components/ui/badge";
import { type User } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { toast } from "sonner";

// Helper to ban/activate
const updateUserStatus = async (id: string, status: 'ACTIVE' | 'BAN', tableMeta: any) => {
    try {
        await api.patch(`/user/${id}/status`, { status });
        toast.success(`User status updated to ${status}`);
        tableMeta?.refetch();
    } catch (e: any) {
        toast.error("Failed to update status");
    }
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue("id")}</span>
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("role")}</Badge>
  },
  {
    accessorKey: "isSeller",
    header: "Seller",
    cell: ({ row }) => {
        return row.original.isSeller ? <Badge className="bg-blue-500">Seller</Badge> : <span className="text-muted-foreground text-sm">User</span>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={status === 'ACTIVE' ? 'default' : 'destructive'}>{status}</Badge>
    }
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
        const user = row.original;

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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    (table.options.meta as any)?.openUserDetail?.(user)
                  }
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.role !== 'ADMIN' && (
                    user.status === 'ACTIVE' ? (
                        <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'BAN', table.options.meta)} className="text-red-500">
                            Ban User
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'ACTIVE', table.options.meta)}>
                            Activate User
                        </DropdownMenuItem>
                    )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
    },
  }
]
