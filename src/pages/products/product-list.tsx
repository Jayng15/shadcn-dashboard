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

type ProductDetail = Product;

export default function ProductListPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null
  );
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

    // const queryClient = useQueryClient();

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["products", sorting, columnFilters], // We might want to include statusFilter effectively if we used API filtering
    queryFn: async () => {
      const response = await api.get("/product?limit=100");
      return response.data;
    },
  });

    // Filter data client-side for "Pending Verification" tab if needed,
    // OR just rely on the table functionality.
    // For "Pending", logic is usually isVerified == false AND status != REJECTED/CLOSED?
    // User requested "Tabs for: All, Pending Verification".

  const allProducts = data?.products || [];
  const pendingProducts = allProducts.filter(
    (p: any) => !p.isVerified && p.status !== "CLOSED"
  ); // Simple logic

  const currentData =
    statusFilter === "PENDING" ? pendingProducts : allProducts;

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

      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={(val) =>
          setStatusFilter(val === "pending" ? "PENDING" : "ALL")
        }
      >
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
