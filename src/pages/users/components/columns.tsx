
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
const updateUserStatus = async (id: string, status: 'ACTIVE' | 'BAN', tableMeta: { refetch: () => void } | undefined) => {
    try {
        await api.patch(`/user/${id}/status`, { status });
        toast.success(`User status updated to ${status}`);
        tableMeta?.refetch();
    } catch {
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
        accessorKey: "fullName",
        header: "Họ và tên",
        cell: ({ row }) => <span className="font-medium text-primary text-sm">{row.getValue("fullName") || "Chưa cập nhật"}</span>
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
    },
    {
        accessorKey: "role",
        header: "Vai trò",
        cell: ({ row }) => <Badge variant="outline">{row.getValue("role")}</Badge>
    },
    {
        accessorKey: "isSeller",
        header: "Người bán",
        cell: ({ row }) => {
            return row.original.isSeller ? <Badge className="bg-blue-500">Người bán</Badge> : <span className="text-muted-foreground text-sm">Người dùng</span>
        }
    },
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return <Badge variant={status === 'ACTIVE' ? 'default' : 'destructive'}>{status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}</Badge>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Ngày tham gia",
        cell: ({ row }) => {
            return new Date(row.getValue("createdAt")).toLocaleDateString()
        }
    },
    {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ row }) => {
            const val = row.getValue("updatedAt") as string;
            return val ? new Date(val).toLocaleString() : "Chưa cập nhật";
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
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                            Sao chép ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() =>
                                (table.options.meta as { openUserDetail?: (u: User) => void })?.openUserDetail?.(user)
                            }
                        >
                            Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.role !== 'ADMIN' && (
                            user.status === 'ACTIVE' ? (
                                <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'BAN', table.options.meta as any)} className="text-red-500">
                                    Khóa người dùng
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => updateUserStatus(user.id, 'ACTIVE', table.options.meta as any)}>
                                    Kích hoạt người dùng
                                </DropdownMenuItem>
                            )
                        )}
                    </DropdownMenuContent>
                    吐            </DropdownMenu>
            )
        },
    }
]
