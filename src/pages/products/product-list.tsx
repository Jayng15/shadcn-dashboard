import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "@/pages/users/components/data-table";
import { columns, type Product } from "./components/columns";
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import DataTablePagination from "@/pages/users/components/data-table-pagination";
import api from "@/lib/api";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exactImageUrl } from "@/lib/utils";
import { UpdateRequestDialog } from "@/components/update-request-dialog";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type ProductDetail = Product;

interface UpdateRequest {
  id: string;
  targetId: string;
  payload: unknown;
  status: string;
  targetType: string;
  createdAt: string;
  name?: string;
  storeName?: string;
}

export default function ProductListPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null
  );
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

  // Update Request State
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["products", sorting, columnFilters],
    queryFn: async () => {
      const response = await api.get("/product?limit=100");
      return response.data;
    },
    enabled: statusFilter !== "requests"
  });

  // Fetch Update Requests
  const { isPending: isRequestPending, data: requestData, refetch: refetchRequests } = useQuery({
    queryKey: ["product-updates"],
    queryFn: async () => {
        const res = await api.get("/product/admin/updates?status=PENDING&targetType=PRODUCT");
        return res.data;
    },
    enabled: statusFilter === "requests"
  });

  const allProducts = useMemo(() => data?.products || [], [data]);
  const pendingProducts = useMemo(
    () => allProducts.filter((p: Product) => !p.isVerified && p.status !== "CLOSED"),
    [allProducts]
  );

  const currentData = useMemo(
    () => (statusFilter === "pending" ? pendingProducts : allProducts),
    [statusFilter, pendingProducts, allProducts]
  );

  const tableMeta = useMemo(() => ({
    refetch: () => {
      refetch();
    },
    openProductDetail: async (product: Product) => {
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      try {
        const res = await api.get(`/product/${product.id}`);
        const detail = res.data.product as ProductDetail;
        setSelectedProduct(detail);
      } catch {
        toast.error("Không thể tải chi tiết sản phẩm");
        setSelectedProduct(product);
      } finally {
        setIsDetailLoading(false);
      }
    },
  }), [refetch]);

  const table = useMemo(() => ({
    data: currentData,
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
  }), [currentData, sorting, columnFilters, tableMeta]);

  const tableInstance = useReactTable(table);

  const requestColumns = useMemo(() => [
    {
      accessorKey: "id",
      header: "ID Yêu cầu",
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
        const id = row.getValue("id");
        const idStr = id ? String(id) : "";
        return <div className="font-medium">{idStr ? `${idStr.substring(0, 8)}...` : 'N/A'}</div>;
      },
    },
    {
      accessorKey: "name",
      header: "Tên sản phẩm",
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => <div className="font-medium">{row.getValue("name") as string || "N/A"}</div>,
    },
    {
      accessorKey: "storeName",
      header: "Cửa hàng",
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => <div className="text-muted-foreground">{row.getValue("storeName") as string || "N/A"}</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Yêu cầu lúc",
        cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
          const date = row.getValue("createdAt");
          if (!date) return <div>N/A</div>;
          try {
            return <div>{new Date(date).toLocaleString()}</div>;
          } catch {
            return <div>N/A</div>;
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
                setSelectedRequest(row.original as UpdateRequest);
                setIsRequestDialogOpen(true);
            }}
          >
            Xem xét
          </Button>
        )
      },
    },
  ], []);

  const requestTableOptions = useMemo(() => ({
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
  }), [requestData?.requests, requestColumns, sorting, columnFilters]);

  const requestTableInstance = useReactTable(requestTableOptions);

  if (error)
    return (
      <div className="p-4 text-red-500">
        Đã xảy ra lỗi: {(error as Error).message}
      </div>
    );

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Sản phẩm</h2>
      </div>

      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="Chi tiết sản phẩm"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Đang tải chi tiết sản phẩm...
          </div>
        )}
        {!isDetailLoading && selectedProduct && (
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-4">
              <img
                src={exactImageUrl(selectedProduct.thumbnailUrl)}
                alt={selectedProduct.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="space-y-1">
                <div className="font-semibold text-base">
                  {selectedProduct.name}
                </div>
                <div>
                  <span className="font-semibold">Giá: </span>
                  <span>
                    {(() => {
                      try {
                        return new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: selectedProduct.currency || "VND",
                        }).format(Number(selectedProduct.price) || 0);
                      } catch {
                        return `${selectedProduct.price || 0} ${selectedProduct.currency || ""}`;
                      }
                    })()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Trạng thái: </span>
                  <span>{selectedProduct.status}</span>
                </div>
                <div>
                  <span className="font-semibold">Đã xác minh: </span>
                  <span>{selectedProduct.isVerified ? "Có" : "Không"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="font-semibold">ID Cửa hàng: </span>
                <span>{selectedProduct.storeId}</span>
              </div>
              <div>
                <span className="font-semibold">ID Người dùng: </span>
                <span>{selectedProduct.userId}</span>
              </div>
              <div>
                <span className="font-semibold">Mô tả: </span>
                <span>{selectedProduct.description}</span>
              </div>
              <div>
                <span className="font-semibold">Kho hàng: </span>
                <span>
                  Tổng {selectedProduct.totalInventory ?? 0} / Đã bán{" "}
                  {selectedProduct.soldInventory ?? 0}
                </span>
              </div>
              <div>
                <span className="font-semibold">Đã đặt trước: </span>
                <span>{selectedProduct.reservedInventory ?? 0}</span>
              </div>
              <div>
                <span className="font-semibold">Tên đội: </span>
                <span>{selectedProduct.teamName}</span>
              </div>
              <div>
                <span className="font-semibold">Thành viên đội: </span>
                <span>{selectedProduct.teamMember}</span>
              </div>
              <div>
                <span className="font-semibold">Yêu thích: </span>
                <span>{selectedProduct.favoriteCount ?? 0}</span>
              </div>
            </div>

            <div className="pt-2">
              {!selectedProduct.isVerified && (
                <Button
                  className="w-full"
                  disabled={isVerifyLoading}
                  onClick={async () => {
                    if (!selectedProduct) return;
                    try {
                      setIsVerifyLoading(true);
                      await api.post(
                        `/product/${selectedProduct.id}/verify`
                      );
                      toast.success("Sản phẩm đã được xác minh");
                      setSelectedProduct((prev) =>
                        prev ? { ...prev, isVerified: true } : prev
                      );
                      refetch();
                    } catch {
                      toast.error("Không thể xác minh sản phẩm");
                    } finally {
                      setIsVerifyLoading(false);
                    }
                  }}
                >
                  Xác minh sản phẩm
                </Button>
              )}
              {selectedProduct.isVerified && (
                <div className="text-xs text-muted-foreground text-center">
                  Sản phẩm này đã được xác minh.
                </div>
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
        type="PRODUCT"
      />

      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={setStatusFilter}
      >
        <TabsList>
          <TabsTrigger value="all">Tất cả sản phẩm</TabsTrigger>
          <TabsTrigger value="pending">Chờ xác minh</TabsTrigger>
          <TabsTrigger value="requests">Yêu cầu cập nhật</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Tất cả sản phẩm</CardTitle>
              <CardDescription>Quản lý tất cả sản phẩm.</CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm tên sản phẩm..."
                    className="pl-8"
                    value={(tableInstance.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => tableInstance.getColumn("name")?.setFilterValue(e.target.value)}
                  />
                </div>
                {tableInstance.getState().columnFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => tableInstance.resetColumnFilters()}>
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {isPending ? "Đang tải..." : <DataTable table={tableInstance} columns={columns} />}
            </CardContent>
            <CardFooter>
              {!isPending && (
                <DataTablePagination table={tableInstance} className="w-full" />
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Sản phẩm chờ duyệt</CardTitle>
              <CardDescription>Sản phẩm cần xác minh.</CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm tên sản phẩm..."
                    className="pl-8"
                    value={(tableInstance.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => tableInstance.getColumn("name")?.setFilterValue(e.target.value)}
                  />
                </div>
                {tableInstance.getState().columnFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => tableInstance.resetColumnFilters()}>
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {isPending ? "Đang tải..." : <DataTable table={tableInstance} columns={columns} />}
            </CardContent>
            <CardFooter>
              {!isPending && (
                <DataTablePagination table={tableInstance} className="w-full" />
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="h-full">
            <Card className="bg-sidebar w-full min-h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Yêu cầu cập nhật</CardTitle>
                    <CardDescription>Xem xét yêu cầu cập nhật sản phẩm.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    {isRequestPending ? "Đang tải..." : <DataTable table={requestTableInstance} columns={requestColumns} />}
                </CardContent>
                 <CardFooter>
                  {!isRequestPending && (
                    <DataTablePagination table={requestTableInstance} className="w-full" />
                  )}
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
