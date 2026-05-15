import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exactImageUrl } from "@/lib/utils";
import { UpdateRequestDialog, type UpdateRequest } from "@/components/update-request-dialog";
import { Input } from "@/components/ui/input";
import { Search, X, Package, Users, Heart, Eye, ShoppingBag, Info, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { useSearch } from "@tanstack/react-router";

type ProductDetail = Product;



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
    const search = useSearch({ from: '/admin/products' }) as { id?: string };

    // Update Request State
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);

    const { isPending, error, data, refetch } = useQuery({
        queryKey: ["products", sorting, columnFilters],
        queryFn: async () => {
            const sort = sorting[0];
            const sortQuery = sort ? `&sortBy=${sort.id}&order=${sort.desc ? 'desc' : 'asc'}` : '';
            const response = await api.get(`/product?limit=100&isAdminView=true${sortQuery}`);
            return response.data;
        },
        enabled: statusFilter !== "requests"
    });

    // Fetch Update Requests
    const { isPending: isRequestPending, data: requestData, refetch: refetchRequests } = useQuery({
        queryKey: ["product-updates", sorting],
        queryFn: async () => {
            const sort = sorting[0];
            const sortQuery = sort ? `&sortBy=${sort.id}&order=${sort.desc ? 'desc' : 'asc'}` : '';
            const res = await api.get(`/productupdates?status=PENDING&targetType=PRODUCT${sortQuery}`);
            return res.data;
        },
        enabled: statusFilter === "requests"
    });

    const allProducts = useMemo(() => {
        const products = data?.products || [];
        return [...products].sort((a: Product, b: Product) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [data]);
    const pendingProducts = useMemo(
        () => allProducts.filter((p: Product) => !p.isVerified && p.status !== "CLOSED"),
        [allProducts]
    );
    const activeProducts = useMemo(
        () => allProducts.filter((p: Product) => p.isVerified && p.status === "AVAILABLE"),
        [allProducts]
    );

    const currentData = useMemo(
        () => {
            if (statusFilter === "pending") return pendingProducts;
            if (statusFilter === "active") return activeProducts;
            return allProducts;
        },
        [statusFilter, pendingProducts, activeProducts, allProducts]
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

    useEffect(() => {
        if (search.id) {
            tableMeta.openProductDetail({ id: search.id } as Product);
        }
    }, []);

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
            header: "Ngày yêu cầu",
            cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
                const date = row.getValue("createdAt");
                if (!date) return <div>N/A</div>;
                try {
                    return <div>{new Date(date).toLocaleString('vi-VN')}</div>;
                } catch {
                    return <div>N/A</div>;
                }
            },
        },
        {
            accessorKey: "updatedAt",
            header: "Ngày cập nhật",
            cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
                const date = row.getValue("updatedAt");
                if (!date) return <div>N/A</div>;
                try {
                    return <div>{new Date(date).toLocaleString('vi-VN')}</div>;
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
                    <div className="space-y-6 text-sm max-h-[75vh] overflow-y-auto pr-2">
                        {/* Header Section */}
                        <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border">
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-background">
                                <img
                                    src={exactImageUrl(selectedProduct.thumbnailUrl)}
                                    alt={selectedProduct.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col justify-center space-y-2">
                                <h3 className="text-lg font-bold leading-none tracking-tight">
                                    {selectedProduct.name}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={selectedProduct.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                        {selectedProduct.status === 'ACTIVE' ? 'Đang hoạt động' :
                                            selectedProduct.status === 'INACTIVE' ? 'Ngưng hoạt động' : selectedProduct.status}
                                    </Badge>
                                    {selectedProduct.isVerified ? (
                                        <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50/50">
                                            <CheckCircle2 className="mr-1 h-3 w-3" /> Đã xác minh
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-50/50">
                                            Chờ xác minh
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: selectedProduct.currency || "VND",
                                    }).format(Number(selectedProduct.price) || 0)}
                                </div>
                            </div>
                        </div>

                        {/* Content Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                    <Info className="h-4 w-4" />
                                    <span>Thông tin cơ bản</span>
                                </div>
                                <div className="space-y-3 rounded-md border p-3 bg-card">
                                    <div className="flex flex-col border-b border-muted pb-3 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground mb-2">Mô tả:</span>
                                        <div className="text-left leading-relaxed max-h-[150px] overflow-y-auto pr-2 whitespace-pre-wrap">{selectedProduct.description || "Chưa có mô tả"}</div>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-muted pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Lượt xem:</span>
                                        <span className="font-medium">1.2k (giả định)</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-muted pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> Yêu thích:</span>
                                        <span className="font-medium text-pink-500">{selectedProduct.favoriteCount ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Inventory Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Kho hàng & Doanh số</span>
                                </div>
                                <div className="space-y-3 rounded-md border p-3 bg-card">
                                    <div className="flex justify-between items-center border-b border-muted pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Tổng tồn kho:</span>
                                        <span className="font-medium">{selectedProduct.totalInventory ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-muted pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground flex items-center gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Đã bán:</span>
                                        <span className="font-medium text-green-600">{selectedProduct.soldInventory ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-muted pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground">Đã đặt trước:</span>
                                        <span className="font-medium text-yellow-600">{selectedProduct.reservedInventory ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Team Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                    <Users className="h-4 w-4" />
                                    <span>Thông tin đội</span>
                                </div>
                                <div className="space-y-3 rounded-md border p-3 bg-card">
                                    <div className="flex justify-between items-center border-b border-muted pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground">Tên đội:</span>
                                        <span className="font-medium">{selectedProduct.teamName || "Chưa có"}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-muted pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground">Thành viên:</span>
                                        <span className="font-medium">{selectedProduct.teamMember || "0"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* IDs / Metadata */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 font-semibold text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    <span>Thông tin hệ thống</span>
                                </div>
                                <div className="space-y-2 text-[11px] font-mono p-3 bg-muted/20 border rounded-md overflow-x-auto">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground uppercase">ID Cửa hàng:</span>
                                        <span className="text-primary">{selectedProduct.storeId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground uppercase">ID Người dùng:</span>
                                        <span className="text-primary">{selectedProduct.userId}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="pt-2">
                            {!selectedProduct.isVerified && (
                                <Button
                                    className="w-full shadow-lg transition-all duration-200"
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
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Xác minh sản phẩm
                                </Button>
                            )}
                            {selectedProduct.isVerified && (
                                <div className="flex items-center justify-center p-3 rounded-md bg-green-50 border border-green-200 text-green-700 font-medium">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Sản phẩm này đã được xác minh và hiển thị công khai.
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
                    <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
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

                <TabsContent value="active" className="h-full">
                    <Card className="bg-sidebar w-full min-h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Sản phẩm đang hoạt động</CardTitle>
                            <CardDescription>Các sản phẩm đã xác minh và đang hiển thị.</CardDescription>
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
