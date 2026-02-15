import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
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

  // Update Request State
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

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

  const allProducts = data?.products || [];
  const pendingProducts = allProducts.filter(
    (p: any) => !p.isVerified && p.status !== "CLOSED"
  );

  const currentData =
    statusFilter === "pending" ? pendingProducts : allProducts;

  const table = useReactTable({
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
    meta: {
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
        } catch (e) {
          toast.error("Failed to load product details");
          setSelectedProduct(product);
        } finally {
          setIsDetailLoading(false);
        }
      },
    },
  });

  const requestColumns = [
    {
      accessorKey: "id",
      header: "Request ID",
      cell: ({ row }: any) => <div className="font-medium">{row.getValue("id").substring(0, 8)}...</div>,
    },
    {
      accessorKey: "targetId",
      header: "Product ID",
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
  ];

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

  if (error)
    return (
      <div className="p-4 text-red-500">
        An error has occurred: {(error as Error).message}
      </div>
    );

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
      </div>

      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="Product Details"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading product details...
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
                  <span className="font-semibold">Price: </span>
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: selectedProduct.currency,
                    }).format(Number(selectedProduct.price))}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Status: </span>
                  <span>{selectedProduct.status}</span>
                </div>
                <div>
                  <span className="font-semibold">Verified: </span>
                  <span>{selectedProduct.isVerified ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="font-semibold">Store ID: </span>
                <span>{selectedProduct.storeId}</span>
              </div>
              <div>
                <span className="font-semibold">User ID: </span>
                <span>{selectedProduct.userId}</span>
              </div>
              <div>
                <span className="font-semibold">Description: </span>
                <span>{selectedProduct.description}</span>
              </div>
              <div>
                <span className="font-semibold">Inventory: </span>
                <span>
                  Total {selectedProduct.totalInventory ?? 0} / Sold{" "}
                  {selectedProduct.soldInventory ?? 0}
                </span>
              </div>
              <div>
                <span className="font-semibold">Reserved: </span>
                <span>{selectedProduct.reservedInventory ?? 0}</span>
              </div>
              <div>
                <span className="font-semibold">Team Name: </span>
                <span>{selectedProduct.teamName}</span>
              </div>
              <div>
                <span className="font-semibold">Team Member: </span>
                <span>{selectedProduct.teamMember}</span>
              </div>
              <div>
                <span className="font-semibold">Favorites: </span>
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
                      toast.success("Product verified");
                      setSelectedProduct((prev) =>
                        prev ? { ...prev, isVerified: true } : prev
                      );
                      refetch();
                    } catch (e) {
                      toast.error("Failed to verify product");
                    } finally {
                      setIsVerifyLoading(false);
                    }
                  }}
                >
                  Verify Product
                </Button>
              )}
              {selectedProduct.isVerified && (
                <div className="text-xs text-muted-foreground text-center">
                  This product is already verified.
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
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="requests">Update Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>All Products</CardTitle>
              <CardDescription>Manage all products.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isPending ? "Loading..." : <DataTable table={table} columns={columns} />}
            </CardContent>
            <CardFooter>
              {!isPending && (
                <DataTablePagination table={table} className="w-full" />
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Pending Products</CardTitle>
              <CardDescription>Products requiring verification.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isPending ? "Loading..." : <DataTable table={table} columns={columns} />}
            </CardContent>
            <CardFooter>
              {!isPending && (
                <DataTablePagination table={table} className="w-full" />
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="h-full">
            <Card className="bg-sidebar w-full min-h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Update Requests</CardTitle>
                    <CardDescription>Review product update requests.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    {isRequestPending ? "Loading..." : <DataTable table={requestTable} columns={requestColumns} />}
                </CardContent>
                 <CardFooter>
                  {!isRequestPending && (
                    <DataTablePagination table={requestTable} className="w-full" />
                  )}
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
