
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
import api from "@/lib/api";
import { UpdateRequestDialog, type UpdateRequest } from "@/components/update-request-dialog";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Star, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exactImageUrl } from "@/lib/utils";
import { toast } from "sonner";

export default function StoreListPage() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
    let allStores = storeData?.stores || [];
    
    // Sort: updatedAt desc, then createdAt desc
    allStores = [...allStores].sort((a: Store, b: Store) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (tabFilter === "requested") {
      return allStores.filter((s: Store) => s.status === "REQUESTED");
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
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
        const id = row.getValue("id") as string;
        return <div className="font-medium">{id ? `${id.substring(0, 8)}...` : "N/A"}</div>;
      },
    },
    {
      accessorKey: "targetId",
      header: "ID Cửa hàng",
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => <div className="font-mono text-xs">{row.getValue("targetId") as string}</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Yêu cầu lúc",
        cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
          const date = row.getValue("createdAt") as string;
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
      cell: ({ row }: { row: { original: UpdateRequest } }) => {
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
      cell: ({ row }: { row: { original: StoreReview } }) => {
        const id = row.original.review?.id;
        return <div className="font-mono text-xs">{id ? `${id.substring(0, 10)}...` : "N/A"}</div>;
      },
    },
    {
      accessorKey: "reviewer.fullName",
      header: "Người đánh giá",
      cell: ({ row }: { row: { original: StoreReview } }) => {
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
      cell: ({ row }: { row: { original: StoreReview } }) => {
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
      cell: ({ row }: { row: { original: StoreReview } }) => {
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
      cell: ({ row }: { row: { original: StoreReview } }) => {
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
      cell: ({ row }: { row: { original: StoreReview } }) => {
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
      cell: ({ row }: { row: { original: StoreReview } }) => {
        const deletedAt = row.original.review?.deletedAt;
        return deletedAt
          ? <Badge variant="destructive" className="text-xs">Đã vô hiệu</Badge>
          : <Badge variant="outline" className="text-xs text-green-600 border-green-500">Hiển thị</Badge>;
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: { row: { original: StoreReview } }) => {
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
      cell: ({ row }: { row: { original: StoreReport } }) => {
        const id = row.original.report?.id || row.original.id;
        return <div className="font-mono text-xs">{id ? `${id.substring(0, 10)}...` : "N/A"}</div>;
      },
    },
    {
      accessorKey: "reporter.fullName",
      header: "Người báo cáo",
      cell: ({ row }: { row: { original: StoreReport } }) => {
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
      cell: ({ row }: { row: { original: StoreReport } }) => {
        const order = row.original.order;
        return <div className="text-xs font-mono">{order?.orderCode || "N/A"}</div>;
      },
    },
    {
      accessorKey: "report.title",
      header: "Tiêu đề",
      cell: ({ row }: { row: { original: StoreReport } }) => {
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
      cell: ({ row }: { row: { original: StoreReport } }) => {
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
      cell: ({ row }: { row: { original: StoreReport } }) => {
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
      cell: ({ row }: { row: { original: StoreReport } }) => {
        const deletedAt = row.original.deletedAt || row.original.report?.deletedAt;
        return deletedAt
          ? <Badge variant="destructive" className="text-xs">Đã vô hiệu</Badge>
          : <Badge variant="outline" className="text-xs text-orange-600 border-orange-500">Đang mở</Badge>;
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: { row: { original: StoreReport } }) => {
        const report = row.original.report || row.original;
        if (!report || report.deletedAt) return null;
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={isInvalidatingReport === report.id}
            onClick={async () => {
              const reportId = report.id;
              setIsInvalidatingReport(reportId ?? null);
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
    openStoreDetail: (store: Store) => {
      navigate({ to: '/stores/$storeId', params: { storeId: store.id } });
    },
    openStoreReviews: (store: Store) => {
      setSelectedStoreForReviews(store);
      setTabFilter("reviews");
    },
    openStoreReports: (store: Store) => {
      setSelectedStoreForReports(store);
      setTabFilter("reports");
    },
  }), [refetchStores, navigate]);

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
                      {storeData?.stores?.filter((s: Store) => s.status === "REQUESTED").length > 0 && (
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

interface StoreReview {
  review: {
    id: string;
    rating: number;
    description: string;
    createdAt: string;
    deletedAt: string | null;
  };
  reviewer: {
    fullName: string;
    avatarUrl: string | null;
  };
  product: {
    name: string;
  };
}

interface StoreReport {
  report?: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    deletedAt: string | null;
  };
  id?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  deletedAt?: string | null;
  reporter: {
    fullName: string;
    avatarUrl: string | null;
  };
  order: {
    orderCode: string;
  };
}
