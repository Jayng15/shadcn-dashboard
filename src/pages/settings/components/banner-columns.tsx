import { ColumnDef } from "@tanstack/react-table"
import DataTableColumnHeader from "./column-header"
import { type Banner } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exactImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const bannerColumns: ColumnDef<Banner>[] = [
  {
    accessorKey: "imageUrl",
    header: "Hình ảnh",
    cell: ({ row }) => {
        const url = row.getValue("imageUrl") as string;
        return (
            <div className="h-12 w-24 relative rounded overflow-hidden border bg-muted">
                <img src={exactImageUrl(url)} alt="Banner" className="object-cover w-full h-full" />
            </div>
        )
    }
  },
  {
    accessorKey: "link",
    header: "Đường dẫn (Link)",
    cell: ({ row }) => {
        const link = row.getValue("link") as string;
        return link ? <a href={link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm truncate max-w-[200px] block">{link}</a> : <span className="text-muted-foreground">-</span>
    }
  },
  {
    accessorKey: "order",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Thứ tự" />
    ),
    cell: ({ row }) => <span>{row.getValue("order")}</span>
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => {
        const isActive = row.getValue("isActive") === "1";
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
        const banner = row.original;
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
                  onClick={() => meta?.openEditDialog?.(banner)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => meta?.deleteBanner?.(banner.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
    },
  }
]
