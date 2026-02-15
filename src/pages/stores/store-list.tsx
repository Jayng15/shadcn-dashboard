
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { UpdateRequestDialog } from "@/components/update-request-dialog";

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

  // Update Request State
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [tabFilter, setTabFilter] = useState("all");

  // Fetch stores
  const { isPending: isStorePending, error: storeError, data: storeData, refetch: refetchStores } = useQuery({
    queryKey: ["stores", sorting, columnFilters],
    queryFn: async () => {
      const res = await api.get("/store?limit=100");
      return res.data;
    },
    enabled: tabFilter !== "requests"
  });

  // Fetch Update Requests
  const { isPending: isRequestPending, data: requestData, refetch: refetchRequests } = useQuery({
    queryKey: ["store-updates"],
    queryFn: async () => {
        const res = await api.get("/store/admin/updates?status=PENDING&targetType=STORE");
        return res.data;
    },
    enabled: tabFilter === "requests"
  });

  const requestColumns = [
    {
      accessorKey: "id",
      header: "Request ID",
      cell: ({ row }: any) => <div className="font-medium">{row.getValue("id").substring(0, 8)}...</div>,
    },
    {
      accessorKey: "targetId",
      header: "Store ID",
      cell: ({ row }: any) => <div className="font-mono text-xs">{row.getValue("targetId")}</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Requested At",
        cell: ({ row }: any) => <div>{new Date(row.getValue("createdAt")).toLocaleString()}</div>,
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
                setSelectedRequest(row.original);
                setIsRequestDialogOpen(true);
            }}
          >
            Review
          </Button>
        )
      },
    },
  ]


  const table = useReactTable({
    data: storeData?.stores || [],
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
      refetch: () => refetchStores(),
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

  const requestTable = useReactTable({
    data: requestData?.requests || [],
    columns: requestColumns,
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
  });

  if (storeError)


    return (
      <div className="p-4 text-red-500">
        An error has occurred: {(storeError as Error).message}
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
                        refetchStores();
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
                        refetchStores();
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
                      refetchStores();
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
                      refetchStores();
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
        <UpdateRequestDialog
            isOpen={isRequestDialogOpen}
            setIsOpen={setIsRequestDialogOpen}
            request={selectedRequest}
            onSuccess={() => refetchRequests()}
            type="STORE"
        />

      <div className="flex-1 p-0">
         <Tabs defaultValue="all" onValueChange={setTabFilter} className="w-full h-full flex flex-col">
            <div className="px-6 pt-4">
                <TabsList>
                    <TabsTrigger value="all">All Stores</TabsTrigger>
                    <TabsTrigger value="requests">Update Requests</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="all" className="flex-1 flex flex-col p-6 pt-2">
                {isStorePending ? (
                    <CardContent>Loading...</CardContent>
                ) : (
                    <>
                    <CardContent className="flex-1 p-0">
                        <DataTable table={table} columns={columns} />
                    </CardContent>
                    <div className="mt-4">
                         <DataTablePagination table={table} className="w-full" />
                    </div>
                    </>
                )}
            </TabsContent>

             <TabsContent value="requests" className="flex-1 flex flex-col p-6 pt-2">
                {isRequestPending ? (
                     <CardContent>Loading Requests...</CardContent>
                ) : (
                    <>
                         <CardContent className="flex-1 p-0">
                            <DataTable table={requestTable} columns={requestColumns} />
                        </CardContent>
                         <div className="mt-4">
                            <DataTablePagination table={requestTable} className="w-full" />
                        </div>
                    </>
                )}
            </TabsContent>
        </Tabs>
      </div>

    </Card>
  );
}
