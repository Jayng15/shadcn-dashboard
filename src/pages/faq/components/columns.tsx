
import { ColumnDef } from "@tanstack/react-table"
import DataTableColumnHeader from "./column-header"
import { Badge } from "@/components/ui/badge";
import { type FAQ } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export const columns: ColumnDef<FAQ>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue("id")}</span>
  },
  {
    accessorKey: "question",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Câu hỏi" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("question")}</span>
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => {
        const isActive = row.getValue("isActive") === "TRUE";
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Đang hoạt động" : "Tạm dừng"}
          </Badge>
        )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
        const faq = row.original;
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
                  onClick={() => meta?.openEditDialog?.(faq)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => meta?.openDeleteDialog?.(faq)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
    },
  }
]
