import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useQuery } from "@tanstack/react-query";
import { fetchUserById } from "@/lib/services";
import { Label } from "@/components/ui/label";
import { type User } from "@/types";

interface WithId<T> {
  id: T;
}

interface DataTableRowActionsProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  row: Row<TData>;
}

export default function DataTableRowActions<TData extends WithId<string>>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const userId = row.original.id as string;

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId),
    enabled: isViewOpen,
  })

  return (
    <>
      <ResponsiveDialog isOpen={isViewOpen} setIsOpen={setIsViewOpen} title="Chi tiết người dùng">
        {isLoading ? (
          <p>Đang tải...</p>
        ) : error ? (
          <p>Lỗi khi tải chi tiết người dùng</p>
        ) : user ? (
          <div className="grid gap-3 py-4">
            <div className="grid grid-cols-4 items-center gap-4 text-sm">
              <Label className="text-right font-bold text-muted-foreground">ID:</Label>
              <p className="col-span-3 font-mono">{user.id}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 text-sm">
              <Label className="text-right font-bold text-muted-foreground">Email:</Label>
              <p className="col-span-3">{user.email}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 text-sm">
              <Label className="text-right font-bold text-muted-foreground">Vai trò:</Label>
              <p className="col-span-3">
                <Badge variant="outline" className="uppercase text-[10px]">
                    {user.role}
                </Badge>
              </p>
            </div>
          </div>
        ) : null}
      </ResponsiveDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Mở menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(userId);
              toast("Đã sao chép ID người dùng vào bộ nhớ tạm");
            }}
          >
            Sao chép ID người dùng
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsViewOpen(true)}>Xem thông tin</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
