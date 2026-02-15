
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "./components/data-table";
import { columns } from "./components/columns";
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import DataTablePagination from "./components/data-table-pagination";
// import DataTableToolBar from "./components/data-table-toolbar";
import api from "@/lib/api";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { type User } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UsersPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["users", sorting, columnFilters],
    queryFn: async () => {
        const res = await api.get('/user/list?limit=100');
        return res.data;
    }
  });

  const table = useReactTable({
    data: data?.users || [],
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      refetch: () => refetch(),
      openUserDetail: async (user: User) => {
        setIsDetailOpen(true);
        setIsDetailLoading(true);
        try {
          const res = await api.get(`/user/${user.id}`);
          // API shape: { success, user, profile }
          const detail = res.data;
          const combined: User = {
            ...user,             // base row data
            ...detail.user,      // core user fields from API
            ...detail.profile,   // profile fields (fullName, contactPhone, etc.)
          };
          setSelectedUser(combined);
        } catch (_) {
          toast.error("Không thể tải chi tiết người dùng");
          // fall back to at least showing the row data
          setSelectedUser(user);
        } finally {
          setIsDetailLoading(false);
        }
      },
    }
  });

  if (error) return <div className="p-4 text-red-500">Đã xảy ra lỗi: {(error as Error).message}</div>;

  return (
    <Card className="bg-sidebar w-full min-h-full flex flex-col">
      <CardHeader>
        <CardTitle>Quản lý tài khoản người dùng</CardTitle>
      </CardHeader>
      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="User Details"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Đang tải chi tiết người dùng...
          </div>
        )}
        {!isDetailLoading && selectedUser && (
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Họ và tên: </span>
                <span>{selectedUser.fullName}</span>
              </div>
              <div>
                <span className="font-semibold">Email: </span>
                <span>{selectedUser.email}</span>
              </div>
              <div>
                <span className="font-semibold">Vai trò: </span>
                <span>{selectedUser.role}</span>
              </div>
              <div>
                <span className="font-semibold">Trạng thái: </span>
                <span>{selectedUser.status}</span>
              </div>
              <div>
                <span className="font-semibold">Người bán: </span>
                <span>{selectedUser.isSeller ? "Có" : "Không"}</span>
              </div>
              <div>
                <span className="font-semibold">Số điện thoại liên hệ: </span>
                <span>{selectedUser.contactPhone}</span>
              </div>
              <div>
                <span className="font-semibold">Email liên hệ: </span>
                <span>{selectedUser.contactEmail}</span>
              </div>
              <div>
                <span className="font-semibold">Giới tính: </span>
                <span>{selectedUser.gender}</span>
              </div>
              <div>
                <span className="font-semibold">Ngày sinh: </span>
                <span>
                  {selectedUser.birthdate
                    ? new Date(selectedUser.birthdate).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div>
                <span className="font-semibold">Địa chỉ: </span>
                <span>{selectedUser.address}</span>
              </div>
              <div>
                <span className="font-semibold">Tiểu sử: </span>
                <span>{selectedUser.bio}</span>
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant={selectedUser.status === "ACTIVE" ? "destructive" : "default"}
                className="w-full"
                onClick={async () => {
                  if (!selectedUser) return;
                  const newStatus = selectedUser.status === "ACTIVE" ? "BAN" : "ACTIVE";
                  try {
                    await api.patch(`/user/${selectedUser.id}/status`, {
                      status: newStatus,
                    });
                    toast.success(`Trạng thái người dùng đã cập nhật thành ${newStatus}`);
                    setSelectedUser({ ...selectedUser, status: newStatus });
                    refetch();
                  } catch (_) {
                    toast.error("Cập nhật trạng thái thất bại");
                  }
                }}
              >
                {selectedUser.status === "ACTIVE" ? "Cấm người dùng" : "Kích hoạt người dùng"}
              </Button>
            </div>
          </div>
        )}
      </ResponsiveDialog>
      {isPending ? (
        <CardContent>Đang tải...</CardContent>
      ) : (
        <>
          <CardContent className="flex-1">
            {/* <DataTableToolBar table={table} />  Toolbar might break if field names changed, disable for now or update */}
            <DataTable table={table} columns={columns} />
          </CardContent>
          <CardFooter>
            <DataTablePagination table={table} className="w-full" />
          </CardFooter>
        </>
      )}
    </Card>
  );
}
