import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
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
import { type FinanceTransaction, columns } from "./components/columns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Search, X } from "lucide-react"



type WithdrawalFeePayload = {
  amount: number
  type: "FIXED" | "PERCENTAGE"
  description?: string
}

function AuthorizedImage({
  url,
  alt,
  className,
}: {
  url: string
  alt: string
  className?: string
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    let active = true
    let objectUrl: string | null = null

    api
      .get(url, { responseType: "blob" })
      .then((res) => {
        if (active) {
          objectUrl = URL.createObjectURL(res.data)
          setSrc(objectUrl)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (active) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (loading) {
    return (
      <div className="flex h-60 w-full items-center justify-center rounded border bg-muted text-sm text-muted-foreground">
        Đang tải hình ảnh...
      </div>
    )
  }

  if (error || !src) {
    return (
      <div className="flex h-60 w-full items-center justify-center rounded border bg-muted text-sm text-muted-foreground">
        Không thể tải hình ảnh
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} />
}

export default function FinancePage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [tabFilter, setTabFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAW" | "PENDING">("ALL")

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedTx, setSelectedTx] = useState<FinanceTransaction | null>(null)
  const [isVerifyLoading, setIsVerifyLoading] = useState(false)

  const [withdrawalFee, setWithdrawalFee] = useState<WithdrawalFeePayload>({
    amount: 0,
    type: "FIXED",
    description: "",
  })

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["finance-transactions", sorting, columnFilters],
    queryFn: async () => {
      const res = await api.get("/finance/admin/transactions?limit=100")
      return res.data
    },
  })

  const feeMutation = useMutation({
    mutationFn: async (payload: WithdrawalFeePayload) => {
      await api.post("/finance/withdrawal-fee", payload)
    },
    onSuccess: () => {
      toast.success("Phí rút tiền đã được cập nhật")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Cập nhật phí rút tiền thất bại")
    },
  })

  const allTransactions: FinanceTransaction[] = data?.transactions || []

  const filteredByType =
    tabFilter === "ALL"
      ? allTransactions
      : tabFilter === "PENDING"
      ? allTransactions.filter((tx) => tx.verifiedStatus === "PENDING")
      : allTransactions.filter((tx) => tx.type === tabFilter)

  const table = useReactTable({
    data: filteredByType,
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
      openFinanceDetail: async (tx: FinanceTransaction) => {
        setIsDetailOpen(true)
        setIsDetailLoading(true)
        try {
          // Reuse data we already have; if backend later has a detail API, call it here.
          setSelectedTx(tx)
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
        <h2 className="text-2xl font-bold tracking-tight">Tài chính</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phí rút tiền</CardTitle>
          <CardDescription>Cập nhật phí áp dụng cho các giao dịch rút tiền.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fee-amount">Số tiền</Label>
            <Input
              id="fee-amount"
              type="number"
              value={withdrawalFee.amount}
              onChange={(e) =>
                setWithdrawalFee((prev) => ({
                  ...prev,
                  amount: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fee-type">Loại</Label>
            <Select
              value={withdrawalFee.type}
              onValueChange={(val: "FIXED" | "PERCENTAGE") =>
                setWithdrawalFee((prev) => ({ ...prev, type: val }))
              }
            >
              <SelectTrigger id="fee-type">
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Cố định</SelectItem>
                <SelectItem value="PERCENTAGE">Phần trăm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="fee-description">Mô tả</Label>
            <Input
              id="fee-description"
              value={withdrawalFee.description}
              onChange={(e) =>
                setWithdrawalFee((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            disabled={feeMutation.isPending}
            onClick={() => feeMutation.mutate(withdrawalFee)}
          >
            Lưu phí rút tiền
          </Button>
        </CardFooter>
      </Card>

      <ResponsiveDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        title="Transaction Details"
      >
        {isDetailLoading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Đang tải chi tiết giao dịch...
          </div>
        )}
        {!isDetailLoading && selectedTx && (
          <div className="space-y-4 text-sm">
            <div className="space-y-1">
              <div>
                <span className="font-semibold">Mã giao dịch: </span>
                <span>{selectedTx.txCode}</span>
              </div>
              <div>
                <span className="font-semibold">ID Người dùng: </span>
                <span>{selectedTx.userId}</span>
              </div>
              <div>
                <span className="font-semibold">ID Tài khoản: </span>
                <span>{selectedTx.accountId}</span>
              </div>
              <div>
                <span className="font-semibold">Loại: </span>
                <span>{selectedTx.type}</span>
              </div>
              <div>
                <span className="font-semibold">Số tiền: </span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: selectedTx.currency,
                  }).format(Number(selectedTx.amount))}
                </span>
              </div>
              <div>
                <span className="font-semibold">Trạng thái: </span>
                <span>{selectedTx.status}</span>
              </div>
              <div>
                <span className="font-semibold">Trạng thái xác minh: </span>
                <span>{selectedTx.verifiedStatus}</span>
              </div>
              <div>
                <span className="font-semibold">Phương thức thanh toán: </span>
                <span>{selectedTx.paymentMethod}</span>
              </div>
              <div>
                <span className="font-semibold">Mô tả: </span>
                <span>{selectedTx.description}</span>
              </div>
              <div>
                <span className="font-semibold">Thời gian giao dịch: </span>
                <span>{new Date(selectedTx.txAt).toLocaleString()}</span>
              </div>
            </div>

            {selectedTx.txProofUrl && (
              <div className="space-y-2">
                <div className="font-semibold">Hình ảnh bằng chứng</div>
                <AuthorizedImage
                  url={`/finance/transactions/${selectedTx.id}/media/proof`}
                  alt="Transaction proof"
                  className="w-full max-h-60 object-contain rounded border"
                />
              </div>
            )}

            {selectedTx.verifiedStatus !== "VERIFIED" && (
              <div className="pt-2">
                <Button
                  className="w-full"
                  disabled={isVerifyLoading}
                  onClick={async () => {
                    if (!selectedTx) return
                    try {
                      setIsVerifyLoading(true)
                      if (selectedTx.type === "WITHDRAW") {
                        await api.post(`/finance/withdraw/${selectedTx.id}/verify`, {
                          status: "VERIFIED",
                        })
                      } else {
                        await api.post(`/finance/deposit/${selectedTx.id}/verify`, {
                          status: "VERIFIED",
                        })
                      }
                      toast.success("Giao dịch đã được xác minh")
                      setSelectedTx((prev) =>
                        prev
                          ? {
                              ...prev,
                              verifiedStatus: "VERIFIED",
                            }
                          : prev
                      )
                      refetch()
                    } catch (_) {
                      toast.error("Xác minh giao dịch thất bại")
                    } finally {
                      setIsVerifyLoading(false)
                    }
                  }}
                >
                  {selectedTx.type === "WITHDRAW"
                    ? "Xác minh rút tiền"
                    : "Xác minh nạp tiền"}
                </Button>
              </div>
            )}
            {selectedTx.verifiedStatus === "VERIFIED" && (
              <div className="text-xs text-muted-foreground text-center">
                Giao dịch này đã được xác minh.
              </div>
            )}
          </div>
        )}
      </ResponsiveDialog>

      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={(val) => {
          switch (val) {
            case "deposits":
              setTabFilter("DEPOSIT")
              break
            case "withdrawals":
              setTabFilter("WITHDRAW")
              break
            case "pending":
              setTabFilter("PENDING")
              break
            default:
              setTabFilter("ALL")
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="deposits">Nạp tiền</TabsTrigger>
          <TabsTrigger value="withdrawals">Rút tiền</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Tất cả giao dịch</CardTitle>
              <CardDescription>Tổng quan về tất cả các giao dịch tài chính.</CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm mã giao dịch..."
                    className="pl-8"
                    value={(table.getColumn("txCode")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("txCode")?.setFilterValue(e.target.value)}
                  />
                </div>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm User ID..."
                    className="pl-8"
                    value={(table.getColumn("userId")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("userId")?.setFilterValue(e.target.value)}
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

        <TabsContent value="deposits" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Nạp tiền</CardTitle>
              <CardDescription>Chỉ các giao dịch nạp tiền.</CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm mã giao dịch..."
                    className="pl-8"
                    value={(table.getColumn("txCode")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("txCode")?.setFilterValue(e.target.value)}
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

        <TabsContent value="withdrawals" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Rút tiền</CardTitle>
              <CardDescription>Chỉ các giao dịch rút tiền.</CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm mã giao dịch..."
                    className="pl-8"
                    value={(table.getColumn("txCode")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("txCode")?.setFilterValue(e.target.value)}
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

        <TabsContent value="pending" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Giao dịch chờ xử lý</CardTitle>
              <CardDescription>Các giao dịch đang chờ xác minh.</CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tìm mã giao dịch..."
                    className="pl-8"
                    value={(table.getColumn("txCode")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("txCode")?.setFilterValue(e.target.value)}
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

