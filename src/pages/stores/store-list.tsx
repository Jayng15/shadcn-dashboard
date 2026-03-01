
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
import { Badge } from "@/components/ui/badge";
import { Star, AlertTriangle, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  // Reviews & Reports State
  const [selectedStoreForReviews, setSelectedStoreForReviews] = useState<Store | null>(null);
  const [selectedStoreForReports, setSelectedStoreForReports] = useState<Store | null>(null);
  const [isInvalidatingReview, setIsInvalidatingReview] = useState<string | null>(null);
  const [isInvalidatingReport, setIsInvalidatingReport] = useState<string | null>(null);

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

  // Fetch Reviews for selected store
  const { isPending: isReviewsPending, data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ["store-reviews", selectedStoreForReviews?.id],
    queryFn: async () => {
      const res = await api.get(`/store/${selectedStoreForReviews!.id}/reviews?limit=100`);
      return res.data;
    },
    enabled: tabFilter === "reviews" && !!selectedStoreForReviews,
  });

  // Fetch Reports for selected store
  const { isPending: isReportsPending, data: reportsData, refetch: refetchReports } = useQuery({
    queryKey: ["store-reports", selectedStoreForReports?.id],
    queryFn: async () => {
      const res = await api.get(`/store/${selectedStoreForReports!.id}/reports?limit=100`);
      return res.data;
    },
    enabled: tabFilter === "reports" && !!selectedStoreForReports,
  });

  const requestColumns = [
    {
      accessorKey: "id",
      header: "ID Yêu cầu",
      cell: ({ row }: any) => <div className="font-medium">{row.getValue("id").substring(0, 8)}...</div>,
    },
    {
      accessorKey: "targetId",
      header: "ID Cửa hàng",
      cell: ({ row }: any) => <div className="font-mono text-xs">{row.getValue("targetId")}</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Yêu cầu lúc",
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
            Xem xét
          </Button>
        )
      },
    },
  ]

  const reviewColumns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => <div className="font-mono text-xs">{row.getValue("id").substring(0, 10)}...</div>,
    },
    {
      accessorKey: "userId",
      header: "User ID",
      cell: ({ row }: any) => <div className="font-mono text-xs truncate max-w-[100px]" title={row.getValue("userId")}>{row.getValue("userId")}</div>,
    },
    {
      accessorKey: "rating",
      header: "Đánh giá",
      cell: ({ row }: any) => {
        const rating = row.getValue("rating") as number;
        return (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{rating}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Nội dung",
      cell: ({ row }: any) => (
        <div className="max-w-[200px] truncate" title={row.getValue("description")}>
          {row.getValue("description") || <span className="text-muted-foreground italic">Không có</span>}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      cell: ({ row }: any) => <div className="text-xs">{new Date(row.getValue("createdAt")).toLocaleString()}</div>,
    },
    {
      accessorKey: "deletedAt",
      header: "Trạng thái",
      cell: ({ row }: any) => {
        const deletedAt = row.getValue("deletedAt");
        return deletedAt
          ? <Badge variant="destructive" className="text-xs">Đã vô hiệu</Badge>
          : <Badge variant="outline" className="text-xs text-green-600 border-green-500">Hiển thị</Badge>;
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const review = row.original;
        if (review.deletedAt) return null;
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={isInvalidatingReview === review.id}
            onClick={async () => {
              setIsInvalidatingReview(review.id);
              try {
                await api.post(`/store/admin/reviews/${review.id}/invalidate`);
                toast.success("Đã vô hiệu hóa đánh giá");
                refetchReviews();
              } catch {
                toast.error("Vô hiệu hóa thất bại");
              } finally {
                setIsInvalidatingReview(null);
              }
            }}
          >
            Vô hiệu hóa
          </Button>
        );
      },
    },
  ];

  const reportColumns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => <div className="font-mono text-xs">{row.getValue("id").substring(0, 10)}...</div>,
    },
    {
      accessorKey: "userId",
      header: "User ID",
      cell: ({ row }: any) => <div className="font-mono text-xs truncate max-w-[100px]" title={row.getValue("userId")}>{row.getValue("userId")}</div>,
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }: any) => (
        <div className="max-w-[150px] truncate font-medium" title={row.getValue("title")}>
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }: any) => (
        <div className="max-w-[200px] truncate" title={row.getValue("description")}>
          {row.getValue("description") || <span className="text-muted-foreground italic">Không có</span>}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      cell: ({ row }: any) => <div className="text-xs">{new Date(row.getValue("createdAt")).toLocaleString()}</div>,
    },
    {
      accessorKey: "deletedAt",
      header: "Trạng thái",
      cell: ({ row }: any) => {
        const deletedAt = row.getValue("deletedAt");
        return deletedAt
          ? <Badge variant="destructive" className="text-xs">Đã vô hiệu</Badge>
          : <Badge variant="outline" className="text-xs text-orange-600 border-orange-500">Đang mở</Badge>;
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const report = row.original;
        if (report.deletedAt) return null;
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={isInvalidatingReport === report.id}
            onClick={async () => {
              setIsInvalidatingReport(report.id);
              try {
                await api.post(`/store/admin/reports/${report.id}/invalidate`);
                toast.success("Đã vô hiệu hóa báo cáo");
                refetchReports();
              } catch {
                toast.error("Vô hiệu hóa thất bại");
              } finally {
                setIsInvalidatingReport(null);
              }
            }}
          >
            Vô hiệu hóa
          </Button>
        );
      },
    },
  ];


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
        } catch (_) {
          toast.error("Không thể tải chi tiết cửa hàng");
          setSelectedStore(store as StoreDetail);
        } finally {
          setIsDetailLoading(false);
        }
      },
      openStoreReviews: (store: Store) => {
        setSelectedStoreForReviews(store);
        setTabFilter("reviews");
      },
      openStoreReports: (store: Store) => {
        setSelectedStoreForReports(store);
        setTabFilter("reports");
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

  const reviewTable = useReactTable({
    data: reviewsData?.reviews || [],
    columns: reviewColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const reportTable = useReactTable({
    data: reportsData?.reports || [],
    columns: reportColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (storeError)


    return (
      <div className="p-4 text-red-500">
        Đã xảy ra lỗi: {(storeError as Error).message}
      </div>
    );

  return (
    <Card className="bg-sidebar w-full min-h-full flex flex-col">
      <CardHeader>
        <CardTitle>Quản lý cửa hàng</CardTitle>
      </CardHeader>
      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="Chi tiết cửa hàng"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Đang tải chi tiết cửa hàng...
          </div>
        )}
        {!isDetailLoading && selectedStore && (
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tên: </span>
                <span>{selectedStore.name}</span>
              </div>
              <div>
                <span className="font-semibold">ID Chủ sở hữu: </span>
                <span>{selectedStore.userId}</span>
              </div>
              <div>
                <span className="font-semibold">Trạng thái: </span>
                <span>{selectedStore.status}</span>
              </div>
              <div>
                <span className="font-semibold">Đã xác minh: </span>
                <span>{selectedStore.isVerified ? "Có" : "Không"}</span>
              </div>
              <div>
                <span className="font-semibold">Lượt theo dõi: </span>
                <span>{selectedStore.followCount ?? 0}</span>
              </div>
              <div>
                <span className="font-semibold">Số điện thoại liên hệ: </span>
                <span>{selectedStore.contactPhone}</span>
              </div>
              <div>
                <span className="font-semibold">Email liên hệ: </span>
                <span>{selectedStore.contactEmail}</span>
              </div>
              <div>
                <span className="font-semibold">Địa chỉ: </span>
                <span>{selectedStore.address}</span>
              </div>
              <div>
                <span className="font-semibold">Mô tả: </span>
                <span>{selectedStore.description}</span>
              </div>
            </div>

            {selectedStore.payment && (
              <div className="space-y-2">
                <div className="font-semibold">Thông tin thanh toán</div>
                <div>
                  <span className="font-semibold">Tên ngân hàng: </span>
                  <span>{selectedStore.payment.bankName}</span>
                </div>
                <div>
                  <span className="font-semibold">Mã ngân hàng: </span>
                  <span>{selectedStore.payment.bankCode}</span>
                </div>
                <div>
                  <span className="font-semibold">Chủ tài khoản: </span>
                  <span>{selectedStore.payment.accountHolderName}</span>
                </div>
                <div>
                  <span className="font-semibold">Số tài khoản: </span>
                  <span>{selectedStore.payment.accountNumber}</span>
                </div>
              </div>
            )}

            {selectedStore.kyc && (
              <div className="space-y-2">
                <div className="font-semibold">Thông tin KYC</div>
                <div>
                  <span className="font-semibold">Status: </span>
                  <span>{selectedStore.kyc.status}</span>
                </div>
                <div>
                  <span className="font-semibold">Đã gửi lúc: </span>
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
                        toast.success("Xác minh cửa hàng thành công");
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
                        toast.error("Xác minh thất bại");
                      } finally {
                        setIsActionLoading(false);
                      }
                    }}
                  >
                    Xác minh cửa hàng
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
                        toast.success("Trạng thái cửa hàng đã cập nhật thành TỪ CHỐI");
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
                        toast.error("Cập nhật trạng thái thất bại");
                      } finally {
                        setIsActionLoading(false);
                      }
                    }}
                  >
                    Từ chối
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
                      toast.success("Trạng thái cửa hàng đã cập nhật thành BỊ CẤM");
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
                      toast.error("Cập nhật trạng thái thất bại");
                    } finally {
                      setIsActionLoading(false);
                    }
                  }}
                >
                  Cấm cửa hàng
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
                      toast.success("Trạng thái cửa hàng đã cập nhật thành HOẠT ĐỘNG");
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
                      toast.error("Cập nhật trạng thái thất bại");
                    } finally {
                      setIsActionLoading(false);
                    }
                  }}
                >
                  Bỏ cấm cửa hàng
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
         <Tabs value={tabFilter} onValueChange={setTabFilter} className="w-full h-full flex flex-col">
            <div className="px-6 pt-4">
                <TabsList>
                    <TabsTrigger value="all">Tất cả cửa hàng</TabsTrigger>
                    <TabsTrigger value="requests">Yêu cầu cập nhật</TabsTrigger>
                    <TabsTrigger value="reviews">
                      Đánh giá
                      {selectedStoreForReviews && (
                        <span className="ml-1 text-xs text-muted-foreground">({selectedStoreForReviews.name})</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                      Báo cáo
                      {selectedStoreForReports && (
                        <span className="ml-1 text-xs text-muted-foreground">({selectedStoreForReports.name})</span>
                      )}
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="all" className="flex-1 flex flex-col p-6 pt-2">
                {isStorePending ? (
                    <CardContent>Đang tải...</CardContent>
                ) : (
                    <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Tìm tên cửa hàng..."
                          className="pl-8"
                          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                        />
                      </div>
                      {table.getState().columnFilters.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
                          <X className="h-4 w-4 mr-1" />
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>
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
                     <CardContent>Đang tải yêu cầu...</CardContent>
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

            <TabsContent value="reviews" className="flex-1 flex flex-col p-6 pt-2">
              {!selectedStoreForReviews ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Star className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Chọn một cửa hàng từ tab "Tất cả cửa hàng" để xem đánh giá.</p>
                  <Button variant="outline" size="sm" onClick={() => setTabFilter("all")}>Quay lại danh sách</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Đánh giá cửa hàng: <span className="text-primary">{selectedStoreForReviews.name}</span></p>
                      <p className="text-xs text-muted-foreground">ID: {selectedStoreForReviews.id}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedStoreForReviews(null); setTabFilter("all"); }}>
                      <X className="h-4 w-4 mr-1" /> Đóng
                    </Button>
                  </div>
                  {isReviewsPending ? (
                    <CardContent>Đang tải đánh giá...</CardContent>
                  ) : (
                    <>
                      <CardContent className="flex-1 p-0">
                        <DataTable table={reviewTable} columns={reviewColumns} />
                      </CardContent>
                      <div className="mt-4">
                        <DataTablePagination table={reviewTable} className="w-full" />
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="reports" className="flex-1 flex flex-col p-6 pt-2">
              {!selectedStoreForReports ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <AlertTriangle className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Chọn một cửa hàng từ tab "Tất cả cửa hàng" để xem báo cáo.</p>
                  <Button variant="outline" size="sm" onClick={() => setTabFilter("all")}>Quay lại danh sách</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Báo cáo cửa hàng: <span className="text-primary">{selectedStoreForReports.name}</span></p>
                      <p className="text-xs text-muted-foreground">ID: {selectedStoreForReports.id}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedStoreForReports(null); setTabFilter("all"); }}>
                      <X className="h-4 w-4 mr-1" /> Đóng
                    </Button>
                  </div>
                  {isReportsPending ? (
                    <CardContent>Đang tải báo cáo...</CardContent>
                  ) : (
                    <>
                      <CardContent className="flex-1 p-0">
                        <DataTable table={reportTable} columns={reportColumns} />
                      </CardContent>
                      <div className="mt-4">
                        <DataTablePagination table={reportTable} className="w-full" />
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
        </Tabs>
      </div>

    </Card>
  );
}
