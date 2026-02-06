import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { useState } from "react";
  import { useQuery } from "@tanstack/react-query";
  import DataTable from "@/pages/users/components/data-table";
  import { columns } from "./components/columns";
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

  export default function ProductListPage() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [statusFilter, setStatusFilter] = useState("ALL");

    // const queryClient = useQueryClient();

    const { isPending, error, data, refetch } = useQuery({
      queryKey: ["products", sorting, columnFilters], // We might want to include statusFilter effectively if we used API filtering
      queryFn: async () => {
        const response = await api.get('/product?limit=100');
        return response.data;
      },
    });

    // Filter data client-side for "Pending Verification" tab if needed,
    // OR just rely on the table functionality.
    // For "Pending", logic is usually isVerified == false AND status != REJECTED/CLOSED?
    // User requested "Tabs for: All, Pending Verification".

    const allProducts = data?.products || [];
    const pendingProducts = allProducts.filter((p: any) => !p.isVerified && p.status !== 'CLOSED'); // Simple logic

    const currentData = statusFilter === 'PENDING' ? pendingProducts : allProducts;

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
          }
      }
    });

    if (error) return <div className="p-4 text-red-500">An error has occurred: {(error as Error).message}</div>;

    return (
      <div className="flex flex-col space-y-4 h-full">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Products</h2>
         </div>

         <Tabs defaultValue="all" className="w-full" onValueChange={(val) => setStatusFilter(val === 'pending' ? 'PENDING' : 'ALL')}>
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
                         {!isPending && <DataTablePagination table={table} className="w-full" />}
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
                         {!isPending && <DataTablePagination table={table} className="w-full" />}
                    </CardFooter>
                 </Card>
            </TabsContent>
         </Tabs>
      </div>
    );
  }
