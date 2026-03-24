
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UpdateRequestDialog, type UpdateRequest } from "@/components/update-request-dialog";
import { Badge } from "@/components/ui/badge";
import { Star, X, Search, Store as StoreIcon, User, Phone, Mail, MapPin, CreditCard, ShieldCheck, History, CheckCircle2, Ban } from "lucide-react";
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
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);
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

  const stores = useMemo(() => {
    const allStores = storeData?.stores || [];
    if (tabFilter === "requested") {
      return allStores.filter((s: any) => s.status === "REQUESTED");
    }
    return allStores;
  }, [storeData, tabFilter]);

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
    meta: tableMeta,
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
          <div className="space-y-6 text-sm">
            {/* Store Header Info */}
            <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-background">
                {selectedStore.avatarUrl ? (
                  <img
                    src={exactImageUrl(selectedStore.avatarUrl)}
                    alt={selectedStore.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground uppercase text-2xl font-bold">
                    {selectedStore.name.substring(0, 1)}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center space-y-2">
                <h3 className="text-xl font-bold leading-none tracking-tight">
                  {selectedStore.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedStore.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {selectedStore.status === 'ACTIVE' ? 'Đang hoạt động' :
                     selectedStore.status === 'REQUESTED' ? 'Đang chờ duyệt' :
                     selectedStore.status === 'BANNED' ? 'Đã bị cấm' :
                     selectedStore.status === 'REJECTED' ? 'Đã từ chối' : selectedStore.status}
                  </Badge>
                  {selectedStore.isVerified && (
                    <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50/50">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Đã xác minh
                    </Badge>
                  )}
                  <Badge variant="secondary" className="font-normal text-muted-foreground">
                    <User className="mr-1 h-3 w-3" /> ID: {selectedStore.userId.substring(0, 8)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic & Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <StoreIcon className="h-4 w-4" />
                  <span>Thông tin cửa hàng</span>
                </div>
                <div className="space-y-3 rounded-md border p-3 bg-card overflow-hidden">
                  <div className="flex flex-col border-b border-muted pb-2 last:border-0 last:pb-0 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Mô tả</span>
                    <span className="mt-1 leading-relaxed text-sm break-words">{selectedStore.description || "Chưa có mô tả"}</span>
                  </div>
                  <div className="flex items-center gap-3 border-b border-muted pb-2 last:border-0 last:pb-0">
                    <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Điện thoại</span>
                      <span className="font-medium">{selectedStore.contactPhone || "Chưa cập nhật"}</span>
                    </div>
                  </div>
                  <div className="items-center gap-3 border-b border-muted pb-2 last:border-0 last:pb-0 flex">
                    <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Email</span>
                      <span className="font-medium">{selectedStore.contactEmail || "Chưa cập nhật"}</span>
                    </div>
                  </div>
                  <div className="items-center gap-3 border-b border-muted pb-2 last:border-0 last:pb-0 flex">
                    <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Địa chỉ</span>
                      <span className="font-medium leading-tight text-xs break-words">{selectedStore.address || "Chưa cập nhật"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Verification */}
              <div className="space-y-4">
                {/* Payment Section */}
                {selectedStore.payment ? (
                  <>
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <CreditCard className="h-4 w-4" />
                      <span>Thanh toán & Ngân hàng</span>
                    </div>
                    <div className="space-y-3 rounded-md border p-3 bg-card shadow-sm border-primary/10">
                      <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                        <span className="font-bold text-primary">{selectedStore.payment.bankName}</span>
                        <Badge variant="outline" className="text-[10px]">{selectedStore.payment.bankCode}</Badge>
                      </div>
                      <div className="px-1 space-y-2 overflow-hidden">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Chủ tài khoản</span>
                          <span className="font-medium truncate">{selectedStore.payment.accountHolderName}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Số tài khoản</span>
                          <span className="font-mono text-lg font-bold text-primary tracking-wider break-all">
                            {selectedStore.payment.accountNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-md border border-dashed text-center text-muted-foreground italic">
                    Chưa có thông tin thanh toán
                  </div>
                )}

                {/* KYC Status */}
                <div className="flex items-center gap-2 font-semibold text-primary pt-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Xác minh danh tính (KYC)</span>
                </div>
                <div className="rounded-md border p-3 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Trạng thái</span>
                      <span className="font-medium text-orange-600">
                        {selectedStore.kyc?.status === 'PENDING' ? 'Đang chờ duyệt' :
                         selectedStore.kyc?.status === 'VERIFIED' ? 'Đã xác minh' :
                         selectedStore.kyc?.status === 'REJECTED' ? 'Đã bị từ chối' : 'Chưa bắt đầu'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                        <History className="h-2 w-2" /> Gửi lúc
                      </span>
                      <span className="text-xs">
                        {selectedStore.kyc?.submittedAt
                          ? new Date(selectedStore.kyc.submittedAt).toLocaleDateString('vi-VN')
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="pt-2 flex flex-wrap gap-3">
              {selectedStore.status === "REQUESTED" && (
                <>
                  <Button
                    className="flex-1 shadow-md hover:shadow-lg transition-all"
                    disabled={isActionLoading}
                    onClick={async () => {
                      if (!selectedStore) return;
                      try {
                        setIsActionLoading(true);
                        await api.post(`/store/${selectedStore.id}/verify`);
                        toast.success("Xác minh cửa hàng thành công");
                        setSelectedStore((prev: StoreDetail | null) => prev ? { ...prev, isVerified: true } : prev);
                        refetchStores();
                      } catch {
                        toast.error("Xác minh thất bại");
                      } finally {
                        setIsActionLoading(false);
                       }
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Phê duyệt cửa hàng
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 shadow-md"
                    disabled={isActionLoading}
                    onClick={async () => {
                      if (!selectedStore) return;
                      try {
                        setIsActionLoading(true);
                        await api.patch(`/store/${selectedStore.id}/status`, { status: "REJECTED" });
                        toast.success("Cửa hàng đã bị từ chối");
                        setSelectedStore((prev: StoreDetail | null) => prev ? { ...prev, status: "REJECTED" } : prev);
                        refetchStores();
                      } catch {
                        toast.error("Từ chối thất bại");
                      } finally {
                        setIsActionLoading(false);
                       }
                    }}
                  >
                    <X className="mr-2 h-4 w-4" /> Từ chối
                  </Button>
                </>
              )}

              {selectedStore.status === "ACTIVE" && (
                <Button
                  variant="destructive"
                  className="w-full shadow-md"
                  disabled={isActionLoading}
                  onClick={async () => {
                    if (!selectedStore) return;
                    try {
                      setIsActionLoading(true);
                      await api.patch(`/store/${selectedStore.id}/status`, { status: "BANNED" });
                      toast.success("Đã cấm cửa hàng");
                      setSelectedStore((prev) => prev ? { ...prev, status: "BANNED" } : prev);
                      refetchStores();
                    } catch (e) {
                      toast.error("Thao tác thất bại");
                    } finally {
                      setIsActionLoading(false);
                    }
                  }}
                >
                  <Ban className="mr-2 h-4 w-4" /> Cấm cửa hàng
                </Button>
              )}

              {selectedStore.status === "BANNED" && (
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary/5 shadow-sm"
                  disabled={isActionLoading}
                  onClick={async () => {
                    if (!selectedStore) return;
                    try {
                      setIsActionLoading(true);
                      await api.patch(`/store/${selectedStore.id}/status`, { status: "ACTIVE" });
                      toast.success("Đã kích hoạt lại cửa hàng");
                      setSelectedStore((prev) => prev ? { ...prev, status: "ACTIVE" } : prev);
                      refetchStores();
                    } catch (e) {
                      toast.error("Thao tác thất bại");
                    } finally {
                      setIsActionLoading(false);
                    }
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Kích hoạt lại cửa hàng
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
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="all">Tất cả cửa hàng</TabsTrigger>
                    <TabsTrigger value="requested" className="relative">
                      Cửa hàng mới
                      {storeData?.stores?.filter((s: any) => s.status === "REQUESTED").length > 0 && (
                        <span className="ml-1.5 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </TabsTrigger>
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

            <TabsContent value="requested" className="flex-1 flex flex-col p-6 pt-2">
                {isStorePending ? (
                    <CardContent>Đang tải...</CardContent>
                ) : (
                    <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Tìm cửa hàng chờ duyệt..."
                          className="pl-8"
                          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                        />
                      </div>
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
