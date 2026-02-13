
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
        } catch (e) {
          toast.error("Failed to load user details");
          // fall back to at least showing the row data
          setSelectedUser(user);
        } finally {
          setIsDetailLoading(false);
        }
      },
    }
  });

  if (error) return <div className="p-4 text-red-500">An error has occurred: {(error as Error).message}</div>;

  return (
    <Card className="bg-sidebar w-full min-h-full flex flex-col">
      <CardHeader>
        <CardTitle>Manage Users Account</CardTitle>
      </CardHeader>
      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="User Details"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading user details...
          </div>
        )}
        {!isDetailLoading && selectedUser && (
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Full Name: </span>
                <span>{selectedUser.fullName}</span>
              </div>
              <div>
                <span className="font-semibold">Email: </span>
                <span>{selectedUser.email}</span>
              </div>
              <div>
                <span className="font-semibold">Role: </span>
                <span>{selectedUser.role}</span>
              </div>
              <div>
                <span className="font-semibold">Status: </span>
                <span>{selectedUser.status}</span>
              </div>
              <div>
                <span className="font-semibold">Seller: </span>
                <span>{selectedUser.isSeller ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="font-semibold">Contact Phone: </span>
                <span>{selectedUser.contactPhone}</span>
              </div>
              <div>
                <span className="font-semibold">Contact Email: </span>
                <span>{selectedUser.contactEmail}</span>
              </div>
              <div>
                <span className="font-semibold">Gender: </span>
                <span>{selectedUser.gender}</span>
              </div>
              <div>
                <span className="font-semibold">Birthdate: </span>
                <span>
                  {selectedUser.birthdate
                    ? new Date(selectedUser.birthdate).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div>
                <span className="font-semibold">Address: </span>
                <span>{selectedUser.address}</span>
              </div>
              <div>
                <span className="font-semibold">Bio: </span>
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
                    toast.success(`User status updated to ${newStatus}`);
                    setSelectedUser({ ...selectedUser, status: newStatus });
                    refetch();
                  } catch (e) {
                    toast.error("Failed to update status");
                  }
                }}
              >
                {selectedUser.status === "ACTIVE" ? "Ban User" : "Activate User"}
              </Button>
            </div>
          </div>
        )}
      </ResponsiveDialog>
      {isPending ? (
        <CardContent>Loading...</CardContent>
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
