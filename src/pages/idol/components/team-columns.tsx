import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Team } from "@/types"
import { SafeImage } from "@/components/safe-image"
import { Link } from "@tanstack/react-router"

export const columns: ColumnDef<Team>[] = [
  {
    accessorKey: "thumbnailUrl",
    header: "Thumbnail",
    cell: ({ row }) => {
      const url = row.getValue("thumbnailUrl") as string | null
      return (
        <div className="h-10 w-10 overflow-hidden rounded-md border">
          {url ? (
             <SafeImage src={url} alt="thumbnail" className="h-full w-full object-cover" />
          ) : (
             <div className="h-full w-full bg-slate-100 flex items-center justify-center text-xs text-muted-foreground">N/A</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Tên nhóm",
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => {
      const desc = row.getValue("description") as string | null;
      return <div className="max-w-[200px] truncate" title={desc || ""}>{desc || "-"}</div>
    }
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
    id: "actions",
    cell: ({ row, table }) => {
      const team = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link to={`/idols/${team.id}` as any}>Quản lý thành viên</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as unknown as { editTeam: (team: Team) => void })?.editTeam?.(team)
              }
            >
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
               className="text-red-600"
              onClick={() =>
                (table.options.meta as unknown as { deleteTeam: (team: Team) => void })?.deleteTeam?.(team)
              }
            >
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
