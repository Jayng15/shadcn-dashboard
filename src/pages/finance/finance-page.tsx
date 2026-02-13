import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
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
import { exactImageUrl } from "@/lib/utils"

type WithdrawalFeePayload = {
  amount: number
  type: "FIXED" | "PERCENTAGE"
  description?: string
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
      toast.success("Withdrawal fee updated")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update withdrawal fee")
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
        An error has occurred: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Fee</CardTitle>
          <CardDescription>Update the fee applied to withdrawal transactions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fee-amount">Amount</Label>
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
            <Label htmlFor="fee-type">Type</Label>
            <Select
              value={withdrawalFee.type}
              onValueChange={(val: "FIXED" | "PERCENTAGE") =>
                setWithdrawalFee((prev) => ({ ...prev, type: val }))
              }
            >
              <SelectTrigger id="fee-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="fee-description">Description</Label>
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
            Save Withdrawal Fee
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
            Loading transaction details...
          </div>
        )}
        {!isDetailLoading && selectedTx && (
          <div className="space-y-4 text-sm">
            <div className="space-y-1">
              <div>
                <span className="font-semibold">Tx Code: </span>
                <span>{selectedTx.txCode}</span>
              </div>
              <div>
                <span className="font-semibold">User ID: </span>
                <span>{selectedTx.userId}</span>
              </div>
              <div>
                <span className="font-semibold">Account ID: </span>
                <span>{selectedTx.accountId}</span>
              </div>
              <div>
                <span className="font-semibold">Type: </span>
                <span>{selectedTx.type}</span>
              </div>
              <div>
                <span className="font-semibold">Amount: </span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: selectedTx.currency,
                  }).format(Number(selectedTx.amount))}
                </span>
              </div>
              <div>
                <span className="font-semibold">Status: </span>
                <span>{selectedTx.status}</span>
              </div>
              <div>
                <span className="font-semibold">Verified Status: </span>
                <span>{selectedTx.verifiedStatus}</span>
              </div>
              <div>
                <span className="font-semibold">Payment Method: </span>
                <span>{selectedTx.paymentMethod}</span>
              </div>
              <div>
                <span className="font-semibold">Description: </span>
                <span>{selectedTx.description}</span>
              </div>
              <div>
                <span className="font-semibold">Tx Time: </span>
                <span>{new Date(selectedTx.txAt).toLocaleString()}</span>
              </div>
            </div>

            {selectedTx.txProofUrl && (
              <div className="space-y-2">
                <div className="font-semibold">Proof Image</div>
                <img
                  src={exactImageUrl(selectedTx.txProofUrl)}
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
                      toast.success("Transaction verified")
                      setSelectedTx((prev) =>
                        prev
                          ? {
                              ...prev,
                              verifiedStatus: "VERIFIED",
                            }
                          : prev
                      )
                      refetch()
                    } catch (e) {
                      toast.error("Failed to verify transaction")
                    } finally {
                      setIsVerifyLoading(false)
                    }
                  }}
                >
                  {selectedTx.type === "WITHDRAW"
                    ? "Verify Withdrawal"
                    : "Verify Deposit"}
                </Button>
              </div>
            )}
            {selectedTx.verifiedStatus === "VERIFIED" && (
              <div className="text-xs text-muted-foreground text-center">
                This transaction is already verified.
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
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Overview of all finance transactions.</CardDescription>
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

        <TabsContent value="deposits" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Deposits</CardTitle>
              <CardDescription>Deposit transactions only.</CardDescription>
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

        <TabsContent value="withdrawals" className="h-full">
          <Card className="bg-sidebar w-full min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Withdrawals</CardTitle>
              <CardDescription>Withdrawal transactions only.</CardDescription>
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
              <CardTitle>Pending Transactions</CardTitle>
              <CardDescription>Transactions awaiting verification.</CardDescription>
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
  )
}

