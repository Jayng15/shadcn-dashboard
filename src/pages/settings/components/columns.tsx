import { ColumnDef } from "@tanstack/react-table"
import DataTableColumnHeader from "./column-header"
import { type Setting } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const columns: ColumnDef<Setting>[] = [
  {
    accessorKey: "key",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Khóa" />
    ),
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("key")}</span>
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Giá trị" />
    ),
    cell: ({ row }) => {
        const val = row.getValue("value") as string;
        return <span className="max-w-[300px] truncate block" title={val}>{val}</span>
    }
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("description") || "-"}</span>
  },
  {
    accessorKey: "updatedAt",
    header: "Cập nhật lần cuối",
    cell: ({ row }) => {
        return new Date(row.getValue("updatedAt")).toLocaleString()
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
        const setting = row.original;
        const meta = table.options.meta as any;

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
                  onClick={() => meta?.openEditDialog?.(setting)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
    },
  }
]
