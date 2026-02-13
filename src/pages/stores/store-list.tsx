
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "@/pages/users/components/data-table"; // Reuse generic table
import { columns, type Store } from "./components/columns";
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import DataTablePagination from "@/pages/users/components/data-table-pagination"; // Reuse
// import DataTableToolBar from "@/pages/users/components/data-table-toolbar"; // Reuse
import api from "@/lib/api";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type StoreDetail = Store & {
  description?: string;
  address?: string;
  avatarUrl?: string;
  isActive?: boolean;
  verifiedAt?: string;
  followCount?: number;
  payment?: {
    storeId: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    paymentQrUrl: string;
    createdAt: string;
    updatedAt: string;
  };
  kyc?: {
    storeId: string;
    frontImageUrl: string;
    backImageUrl: string;
    status: string;
    submittedAt: string;
    details: string;
    createdAt: string;
    updatedAt: string;
  };
};

export default function StoreListPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreDetail | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch stores from our API
  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["stores", sorting, columnFilters],
    queryFn: async () => {
      // TODO: Map sorting/filters to API query params if backend supports it
      const res = await api.get("/store?limit=100"); // Fetch 100 for now, client side pagination
      return res.data;
    },
  });

  const table = useReactTable({
    data: data?.stores || [],
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
      openStoreDetail: async (store: Store) => {
        setIsDetailOpen(true);
        setIsDetailLoading(true);
        try {
          const res = await api.get(`/store/detail/${store.id}`);
          const detail = res.data.store;
          const combined: StoreDetail = {
            ...store,
            ...detail,
            payment: detail.payment,
            kyc: detail.kyc,
          };
          setSelectedStore(combined);
        } catch (e) {
          toast.error("Failed to load store details");
          setSelectedStore(store as StoreDetail);
        } finally {
          setIsDetailLoading(false);
        }
      },
    },
  });

  if (error)
    return (
      <div className="p-4 text-red-500">
        An error has occurred: {(error as Error).message}
      </div>
    );

  return (
    <Card className="bg-sidebar w-full min-h-full flex flex-col">
      <CardHeader>
        <CardTitle>Manage Stores</CardTitle>
      </CardHeader>
      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="Store Details"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading store details...
          </div>
        )}
        {!isDetailLoading && selectedStore && (
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name: </span>
                <span>{selectedStore.name}</span>
              </div>
              <div>
                <span className="font-semibold">Owner User ID: </span>
                <span>{selectedStore.userId}</span>
              </div>
              <div>
                <span className="font-semibold">Status: </span>
                <span>{selectedStore.status}</span>
              </div>
              <div>
                <span className="font-semibold">Verified: </span>
                <span>{selectedStore.isVerified ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="font-semibold">Follow Count: </span>
                <span>{selectedStore.followCount ?? 0}</span>
              </div>
              <div>
                <span className="font-semibold">Contact Phone: </span>
                <span>{selectedStore.contactPhone}</span>
              </div>
              <div>
                <span className="font-semibold">Contact Email: </span>
                <span>{selectedStore.contactEmail}</span>
              </div>
              <div>
                <span className="font-semibold">Address: </span>
                <span>{selectedStore.address}</span>
              </div>
              <div>
                <span className="font-semibold">Description: </span>
                <span>{selectedStore.description}</span>
              </div>
            </div>

            {selectedStore.payment && (
              <div className="space-y-2">
                <div className="font-semibold">Payment Information</div>
                <div>
                  <span className="font-semibold">Bank Name: </span>
                  <span>{selectedStore.payment.bankName}</span>
                </div>
                <div>
                  <span className="font-semibold">Bank Code: </span>
                  <span>{selectedStore.payment.bankCode}</span>
                </div>
                <div>
                  <span className="font-semibold">Account Holder: </span>
                  <span>{selectedStore.payment.accountHolderName}</span>
                </div>
                <div>
                  <span className="font-semibold">Account Number: </span>
                  <span>{selectedStore.payment.accountNumber}</span>
                </div>
              </div>
            )}

            {selectedStore.kyc && (
              <div className="space-y-2">
                <div className="font-semibold">KYC Information</div>
                <div>
                  <span className="font-semibold">Status: </span>
                  <span>{selectedStore.kyc.status}</span>
                </div>
                <div>
                  <span className="font-semibold">Submitted At: </span>
                  <span>
                    {selectedStore.kyc.submittedAt
                      ? new Date(
                          selectedStore.kyc.submittedAt
                        ).toLocaleString()
                      : "-"}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-2">
              {selectedStore.status === "REQUESTED" && (
                <>
                  <Button
                    size="sm"
                    disabled={isActionLoading}
                    onClick={async () => {
                      if (!selectedStore) return;
                      try {
                        setIsActionLoading(true);
                        await api.post(`/store/${selectedStore.id}/verify`);
                        toast.success("Store verified successfully");
                        setSelectedStore((prev) =>
                          prev
                            ? {
                                ...prev,
                                isVerified: true,
                              }
                            : prev
                        );
                        refetch();
                      } catch (e) {
                        toast.error("Verification failed");
                      } finally {
                        setIsActionLoading(false);
                      }
                    }}
                  >
                    Verify Store
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isActionLoading}
                    onClick={async () => {
                      if (!selectedStore) return;
                      try {
                        setIsActionLoading(true);
                        await api.patch(`/store/${selectedStore.id}/status`, {
                          status: "REJECTED",
                        });
                        toast.success("Store status updated to REJECTED");
                        setSelectedStore((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: "REJECTED",
                              }
                            : prev
                        );
                        refetch();
                      } catch (e) {
                        toast.error("Status update failed");
                      } finally {
                        setIsActionLoading(false);
                      }
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}

              {selectedStore.status === "ACTIVE" && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isActionLoading}
                  onClick={async () => {
                    if (!selectedStore) return;
                    try {
                      setIsActionLoading(true);
                      await api.patch(`/store/${selectedStore.id}/status`, {
                        status: "BANNED",
                      });
                      toast.success("Store status updated to BANNED");
                      setSelectedStore((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: "BANNED",
                            }
                          : prev
                      );
                      refetch();
                    } catch (e) {
                      toast.error("Status update failed");
                    } finally {
                      setIsActionLoading(false);
                    }
                  }}
                >
                  Ban Store
                </Button>
              )}

              {selectedStore.status === "BANNED" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isActionLoading}
                  onClick={async () => {
                    if (!selectedStore) return;
                    try {
                      setIsActionLoading(true);
                      await api.patch(`/store/${selectedStore.id}/status`, {
                        status: "ACTIVE",
                      });
                      toast.success("Store status updated to ACTIVE");
                      setSelectedStore((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: "ACTIVE",
                            }
                          : prev
                      );
                      refetch();
                    } catch (e) {
                      toast.error("Status update failed");
                    } finally {
                      setIsActionLoading(false);
                    }
                  }}
                >
                  Unban Store
                </Button>
              )}
            </div>
          </div>
        )}
      </ResponsiveDialog>
      {isPending ? (
        <CardContent>Loading...</CardContent>
      ) : (
        <>
          <CardContent className="flex-1">
            {/* <DataTableToolBar table={table} /> */}
            {/* Toolbar might need customization for specific filters, check compatibility */}
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
