import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import DataTable from "@/pages/users/components/data-table"
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import DataTablePagination from "@/pages/users/components/data-table-pagination"
import api from "@/lib/api"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { type Order, columns } from "./components/columns"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrderPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [tabFilter, setTabFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED">("ALL")

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["admin-orders", sorting, columnFilters],
    queryFn: async () => {
      const res = await api.get("/order/admin?limit=100")
      return res.data
    },
  })

  const allOrders: Order[] = data?.orders || []

  const filteredOrders =
    tabFilter === "ALL"
      ? allOrders
      : allOrders.filter((order) => {
          if (tabFilter === "PROCESSING") {
             // Treat CONFIRMED, AWAITING_PAYMENT, PROCESSING as PROCESSING logically for filter
             return ["CONFIRMED", "AWAITING_PAYMENT", "PROCESSING"].includes(order.status)
          }
          if (tabFilter === "SHIPPED") {
              return ["SHIPPED", "IN_TRANSIT"].includes(order.status)
          }
          return order.status === tabFilter
      })

  const table = useReactTable({
    data: filteredOrders,
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
      refetch: () => refetch(),
      openOrderDetail: async (order: Order) => {
        setIsDetailOpen(true)
        setIsDetailLoading(true)
        try {
          setSelectedOrder(order)
        } finally {
          setIsDetailLoading(false)
        }
      },
    },
  })

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Đã xảy ra lỗi: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Đơn hàng (Orders)</h2>
      </div>

      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="Chi tiết đơn hàng"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Đang tải chi tiết đơn hàng...
          </div>
        )}
        {!isDetailLoading && selectedOrder && (
          <div className="space-y-4 text-sm max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 border-b pb-4">
              <div>
                <span className="font-semibold text-muted-foreground block text-xs">Mã đơn: </span>
                <span>{selectedOrder.orderCode}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground block text-xs">Thời gian: </span>
                <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground block text-xs">Trạng thái: </span>
                <span>{selectedOrder.status}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground block text-xs">Tổng tiền: </span>
                <span className="font-bold text-primary">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(selectedOrder.totalAmount))}
                </span>
              </div>
            </div>

            <div className="space-y-1 border-b pb-4">
              <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
              <div className="grid grid-cols-1 gap-1">
                <div><span className="font-medium">Họ tên:</span> {selectedOrder.customerFullName}</div>
                <div><span className="font-medium">SĐT:</span> {selectedOrder.customerContactPhone}</div>
                <div><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</div>
                <div><span className="font-medium">Địa chỉ:</span> {selectedOrder.shippingAddress}</div>
                {selectedOrder.notes && (
                  <div><span className="font-medium">Ghi chú:</span> {selectedOrder.notes}</div>
                )}
              </div>
            </div>

            {selectedOrder.shipmentProvider && (
              <div className="space-y-1 border-b pb-4">
                <h4 className="font-semibold mb-2">Vận chuyển</h4>
                <div className="grid grid-cols-2 gap-1">
                  <div><span className="font-medium">Đơn vị VT:</span> {selectedOrder.shipmentProvider}</div>
                  <div><span className="font-medium">Mã vận đơn:</span> {selectedOrder.shipmentCode}</div>
                  <div><span className="font-medium">Phí ship:</span> {selectedOrder.shippingFee ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(selectedOrder.shippingFee)) : '0'}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
               <h4 className="font-semibold">Sản phẩm</h4>
               <div className="rounded-md border divide-y">
                 {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                        <div key={item.id} className="p-3 bg-muted/30">
                            <div className="flex justify-between font-medium">
                                <span>ID: <span className="text-xs text-muted-foreground">{item.productId}</span></span>
                                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(item.totalLine))}</span>
                            </div>
                            <div className="text-muted-foreground text-sm mt-1">
                                {item.quantity} x {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(item.unitPrice))}
                            </div>
                        </div>
                    ))
                 ) : (
                     <div className="p-3 text-center text-muted-foreground">Không có chi tiết sản phẩm</div>
                 )}
               </div>
               <div className="flex justify-between items-center pt-2 font-medium">
                   <span>Tạm tính</span>
                   <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(selectedOrder.subtotalAmount))}</span>
               </div>
            </div>

            <div className="pt-2 text-xs text-muted-foreground">
               <div className="break-all">ID: {selectedOrder.id}</div>
               <div className="break-all">User ID: {selectedOrder.userId}</div>
               <div className="break-all">Store ID: {selectedOrder.storeId}</div>
            </div>
          </div>
        )}
      </ResponsiveDialog>

      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={(val) => {
          switch (val) {
            case "pending":
              setTabFilter("PENDING")
              break
            case "processing":
              setTabFilter("PROCESSING")
              break
            case "shipped":
              setTabFilter("SHIPPED")
              break
            case "delivered":
              setTabFilter("DELIVERED")
              break
            case "completed":
              setTabFilter("COMPLETED")
              break
            case "cancelled":
              setTabFilter("CANCELLED")
              break
            default:
              setTabFilter("ALL")
          }
        }}
      >
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
          <TabsTrigger value="processing">Đang chuẩn bị</TabsTrigger>
          <TabsTrigger value="shipped">Đang giao</TabsTrigger>
          <TabsTrigger value="delivered">Đã giao</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
          <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
        </TabsList>

        <TabsContent value={tabFilter.toLowerCase()} className="h-full mt-4">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Danh sách đơn hàng</CardTitle>
              <CardDescription>Quản lý tất cả đơn hàng trên hệ thống.</CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm mã đơn hàng..."
                    className="pl-8"
                    value={(table.getColumn("orderCode")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("orderCode")?.setFilterValue(e.target.value)}
                  />
                </div>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm tên khách hàng..."
                    className="pl-8"
                    value={(table.getColumn("customerFullName")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("customerFullName")?.setFilterValue(e.target.value)}
                  />
                </div>
                {table.getState().columnFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {isPending ? "Đang tải..." : <DataTable table={table} columns={columns} />}
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
  )
}
