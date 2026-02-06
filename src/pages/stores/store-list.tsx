
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";

  import { useState } from "react";
  import { useQuery } from "@tanstack/react-query";
  import DataTable from "@/pages/users/components/data-table"; // Reuse generic table
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
  import DataTablePagination from "@/pages/users/components/data-table-pagination"; // Reuse
  // import DataTableToolBar from "@/pages/users/components/data-table-toolbar"; // Reuse
  import api from "@/lib/api";

  export default function StoreListPage() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    // Fetch stores from our API
    const { isPending, error, data, refetch } = useQuery({
      queryKey: ["stores", sorting, columnFilters],
      queryFn: async () => {
        // TODO: Map sorting/filters to API query params if backend supports it
        const res = await api.get('/store?limit=100'); // Fetch 100 for now, client side pagination
        return res.data;
      },
    });

    const table = useReactTable({
      data: data?.stores || [],
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
          refetch: () => refetch()
      }
    });

    if (error) return <div className="p-4 text-red-500">An error has occurred: {(error as Error).message}</div>;

    return (
      <Card className="bg-sidebar w-full min-h-full flex flex-col">
        <CardHeader>
          <CardTitle>Manage Stores</CardTitle>
        </CardHeader>
        {isPending ? (
          <CardContent>Loading...</CardContent>
        ) : (
          <>
            <CardContent className="flex-1">
              {/* <DataTableToolBar table={table} /> */}
              {/* Toolbar might need customization for specific filters, check compatibility */}
              <DataTable table={table} columns={columns} />
            </CardContent>
            <CardFooter>
              <DataTablePagination table={table} className="w-full" />
            </CardFooter>
          </>
        )}
      </Card>
    );
  }
