
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
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
import { Star, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { exactImageUrl } from "@/lib/utils";

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
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
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

  // Fetch Reviews
  const { isPending: isReviewsPending, data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ["store-reviews", selectedStoreForReviews?.id],
    queryFn: async () => {
      const endpoint = selectedStoreForReviews
        ? `/store/${selectedStoreForReviews.id}/reviews?limit=100`
        : `/store/admin/all-reviews?limit=100`;
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: tabFilter === "reviews",
  });

  // Fetch Reports
  const { isPending: isReportsPending, data: reportsData, refetch: refetchReports } = useQuery({
    queryKey: ["store-reports", selectedStoreForReports?.id],
    queryFn: async () => {
      const endpoint = selectedStoreForReports
        ? `/store/${selectedStoreForReports.id}/reports?limit=100`
        : `/store/admin/all-reports?limit=100`;
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: tabFilter === "reports",
  });

  const stores = useMemo(() => storeData?.stores || [], [storeData]);
  const requests = useMemo(() => requestData?.requests || [], [requestData]);
  const reviews = useMemo(() => reviewsData?.reviews || [], [reviewsData]);
  const reports = useMemo(() => reportsData?.reports || [], [reportsData]);

  const requestColumns = useMemo(() => [
    {
      accessorKey: "id",
      header: "ID Yêu cầu",
      cell: ({ row }: any) => {
        const id = row.getValue("id") as string;
        return <div className="font-medium">{id ? `${id.substring(0, 8)}...` : "N/A"}</div>;
      },
    },
    {
      accessorKey: "targetId",
      header: "ID Cửa hàng",
      cell: ({ row }: any) => <div className="font-mono text-xs">{row.getValue("targetId")}</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Yêu cầu lúc",
        cell: ({ row }: any) => {
          const date = row.getValue("createdAt");
          if (!date) return <div>-</div>;
          try {
            return <div>{new Date(date).toLocaleString()}</div>;
          } catch {
            return <div>-</div>;
          }
        },
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => {
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
  ], []);

  const reviewColumns = useMemo(() => [
    {
      accessorKey: "review.id",
      header: "ID",
      cell: ({ row }: any) => {
        const id = row.original.review?.id;
        return <div className="font-mono text-xs">{id ? `${id.substring(0, 10)}...` : "N/A"}</div>;
      },
    },
    {
      accessorKey: "reviewer.fullName",
      header: "Người đánh giá",
      cell: ({ row }: any) => {
        const reviewer = row.original.reviewer;
        return (
          <div className="flex items-center gap-2">
            {reviewer?.avatarUrl && (
              <img src={exactImageUrl(reviewer.avatarUrl)} className="h-6 w-6 rounded-full object-cover" alt="" />
            )}
            <span className="text-xs font-medium">{reviewer?.fullName || "Ẩn danh"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "product.name",
      header: "Sản phẩm",
      cell: ({ row }: any) => {
        const product = row.original.product;
        return (
          <div className="max-w-[150px] truncate text-xs" title={product?.name}>
            {product?.name || <span className="text-muted-foreground italic">N/A</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "review.rating",
      header: "Đánh giá",
      cell: ({ row }: any) => {
        const rating = row.original.review?.rating;
        return (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{rating ?? 0}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "review.description",
      header: "Nội dung",
      cell: ({ row }: any) => {
        const description = row.original.review?.description;
        return (
          <div className="max-w-[150px] truncate" title={description}>
            {description || <span className="text-muted-foreground italic">Không có</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "review.createdAt",
      header: "Thời gian",
      cell: ({ row }: any) => {
        const date = row.original.review?.createdAt;
        if (!date) return <div className="text-xs">-</div>;
        try {
          return <div className="text-xs">{new Date(date).toLocaleString()}</div>;
        } catch {
          return <div className="text-xs">-</div>;
        }
      },
    },
    {
      accessorKey: "review.deletedAt",
      header: "Trạng thái",
      cell: ({ row }: any) => {
        const deletedAt = row.original.review?.deletedAt;
        return deletedAt
          ? <Badge variant="destructive" className="text-xs">Đã vô hiệu</Badge>
          : <Badge variant="outline" className="text-xs text-green-600 border-green-500">Hiển thị</Badge>;
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const review = row.original.review;
        if (!review || review.deletedAt) return null;
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={isInvalidatingReview === review.id}
            onClick={async () => {
              const reviewId = review.id;
              setIsInvalidatingReview(reviewId);
              try {
                await api.post(`/store/admin/reviews/${reviewId}/invalidate`);
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
  ], [isInvalidatingReview, refetchReviews]);

  const reportColumns = useMemo(() => [
    {
      accessorKey: "report.id",
      header: "ID",
      cell: ({ row }: any) => {
        const id = row.original.report?.id || row.original.id;
        return <div className="font-mono text-xs">{id ? `${id.substring(0, 10)}...` : "N/A"}</div>;
      },
    },
    {
      accessorKey: "reporter.fullName",
      header: "Người báo cáo",
      cell: ({ row }: any) => {
        const reporter = row.original.reporter;
        return (
          <div className="flex items-center gap-2">
            {reporter?.avatarUrl && (
              <img src={exactImageUrl(reporter.avatarUrl)} className="h-6 w-6 rounded-full object-cover" alt="" />
            )}
            <span className="text-xs font-medium">{reporter?.fullName || "Ẩn danh"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "order.orderCode",
      header: "Đơn hàng",
      cell: ({ row }: any) => {
        const order = row.original.order;
        return <div className="text-xs font-mono">{order?.orderCode || "N/A"}</div>;
      },
    },
    {
      accessorKey: "report.title",
      header: "Tiêu đề",
      cell: ({ row }: any) => {
        const title = row.original.report?.title || row.original.title;
        return (
          <div className="max-w-[120px] truncate font-medium text-xs" title={title}>
            {title || "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "report.description",
      header: "Mô tả",
      cell: ({ row }: any) => {
        const description = row.original.report?.description || row.original.description;
        return (
          <div className="max-w-[150px] truncate text-xs" title={description}>
            {description || <span className="text-muted-foreground italic">Không có</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      cell: ({ row }: any) => {
        const date = row.original.createdAt || row.original.report?.createdAt;
        if (!date) return <div className="text-xs">-</div>;
        try {
          return <div className="text-xs">{new Date(date).toLocaleString()}</div>;
        } catch {
          return <div className="text-xs">-</div>;
        }
      },
    },
    {
      accessorKey: "deletedAt",
      header: "Trạng thái",
      cell: ({ row }: any) => {
        const deletedAt = row.original.deletedAt || row.original.report?.deletedAt;
        return deletedAt
          ? <Badge variant="destructive" className="text-xs">Đã vô hiệu</Badge>
          : <Badge variant="outline" className="text-xs text-orange-600 border-orange-500">Đang mở</Badge>;
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const report = row.original.report || row.original;
        if (!report || report.deletedAt) return null;
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={isInvalidatingReport === report.id}
            onClick={async () => {
              const reportId = report.id;
              setIsInvalidatingReport(reportId);
              try {
                await api.post(`/store/admin/reports/${reportId}/invalidate`);
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
  ], [isInvalidatingReport, refetchReports]);


  const tableMeta = useMemo(() => ({
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
      } catch {
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
  }), [refetchStores]);

  const table = useReactTable({
    data: stores,
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
    meta: tableMeta,
  });

  const requestTable = useReactTable({
    data: requests,
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
    data: reviews,
    columns: reviewColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const reportTable = useReactTable({
    data: reports,
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
                      } catch {
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
                      } catch {
                        toast.error("Từ chối thất bại");
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
                <div className="flex items-center justify-between mb-3 h-12">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedStoreForReviews ? `Đánh giá: ${selectedStoreForReviews.name}` : "Tất cả đánh giá"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedStoreForReviews ? `ID Cửa hàng: ${selectedStoreForReviews.id}` : "Đang hiển thị đánh giá mới nhất từ tất cả cửa hàng"}
                    </p>
                  </div>
                  {selectedStoreForReviews && (
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedStoreForReviews(null)}>
                      <X className="h-4 w-4 mr-1" /> Xóa bộ lọc
                    </Button>
                  )}
                </div>
                {isReviewsPending ? (
                  <CardContent className="flex-1 flex items-center justify-center">Đang tải đánh giá...</CardContent>
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
            </TabsContent>

            <TabsContent value="reports" className="flex-1 flex flex-col p-6 pt-2">
                <div className="flex items-center justify-between mb-3 h-12">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedStoreForReports ? `Báo cáo: ${selectedStoreForReports.name}` : "Tất cả báo cáo"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedStoreForReports ? `ID Cửa hàng: ${selectedStoreForReports.id}` : "Đang hiển thị báo cáo mới nhất từ tất cả cửa hàng"}
                    </p>
                  </div>
                  {selectedStoreForReports && (
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedStoreForReports(null)}>
                      <X className="h-4 w-4 mr-1" /> Xóa bộ lọc
                    </Button>
                  )}
                </div>
                {isReportsPending ? (
                  <CardContent className="flex-1 flex items-center justify-center">Đang tải báo cáo...</CardContent>
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
            </TabsContent>
        </Tabs>
      </div>

    </Card>
  );
}
