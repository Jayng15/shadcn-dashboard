import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useMemo } from "react"
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
import { Search, X, Upload } from "lucide-react"
import { useSearch } from "@tanstack/react-router"
import { User } from "@/types"



type WithdrawalFeePayload = {
    amount: number
    type: "FIXED" | "PERCENTAGE"
    description?: string
}

type AdminBankInfo = {
    bankName: string
    accountNumber: string
    accountOwner: string
    qrCodeUrl: string | null
}

type MinDepositAmount = {
    amount: number
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
    const [tabFilter, setTabFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAW" | "PENDING" | "REVENUE" | "PAYMENT">("ALL")

    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isDetailLoading, setIsDetailLoading] = useState(false)
    const [selectedTx, setSelectedTx] = useState<FinanceTransaction | null>(null)
    const [isVerifyLoading, setIsVerifyLoading] = useState(false)
    const search = useSearch({ from: '/finance' }) as { id?: string }

    const [withdrawalFee, setWithdrawalFee] = useState<WithdrawalFeePayload>({
        amount: 0,
        type: "FIXED",
        description: "",
    })

    const [bankInfo, setBankInfo] = useState<AdminBankInfo>({
        bankName: "",
        accountNumber: "",
        accountOwner: "",
        qrCodeUrl: null,
    })
    const [qrFile, setQrFile] = useState<File | null>(null)
    const [qrPreview, setQrPreview] = useState<string | null>(null)

    const [minDeposit, setMinDeposit] = useState<MinDepositAmount>({
        amount: 0,
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

    const { data: bankData, refetch: refetchBank } = useQuery({
        queryKey: ["admin-bank-info"],
        queryFn: async () => {
            const res = await api.get("/finance/admin-bank")
            return res.data
        },
    })

    useEffect(() => {
        if (bankData?.info) {
            setBankInfo({
                bankName: bankData.info.bankName,
                accountNumber: bankData.info.accountNumber,
                accountOwner: bankData.info.accountOwner,
                qrCodeUrl: bankData.info.qrCodeUrl,
            })
        }
    }, [bankData])

    const bankMutation = useMutation({
        mutationFn: async (payload: { bankName: string; accountNumber: string; accountOwner: string; qrCode?: File }) => {
            const formData = new FormData()
            formData.append("bankName", payload.bankName)
            formData.append("accountNumber", payload.accountNumber)
            formData.append("accountOwner", payload.accountOwner)
            if (payload.qrCode) {
                formData.append("qrCode", payload.qrCode)
            }
            await api.post("/finance/admin-bank", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
        },
        onSuccess: () => {
            toast.success("Thông tin ngân hàng đã được cập nhật")
            refetchBank()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Cập nhật thông tin ngân hàng thất bại")
        },
    })

    const { data: minDepositData, refetch: refetchMinDeposit } = useQuery({
        queryKey: ["min-deposit-amount"],
        queryFn: async () => {
            const res = await api.get("/finance/deposit-min-amount")
            return res.data
        },
    })

    useEffect(() => {
        if (minDepositData?.info) {
            setMinDeposit({
                amount: Number(minDepositData.info.amount),
                description: minDepositData.info.description || "",
            })
        }
    }, [minDepositData])

    const minDepositMutation = useMutation({
        mutationFn: async (payload: MinDepositAmount) => {
            await api.post("/finance/deposit-min-amount", payload)
        },
        onSuccess: () => {
            toast.success("Tiền nạp tối thiểu đã được cập nhật")
            refetchMinDeposit()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Cập nhật tiền nạp tối thiểu thất bại")
        },
    })

    const { data: usersData } = useQuery({
        queryKey: ["users-list"],
        queryFn: async () => {
            const res = await api.get("/user/list?limit=1000")
            return res.data
        },
    })

    const userMap = useMemo(() => {
        return (usersData?.users || []).reduce((acc: Record<string, string>, user: User) => {
            acc[user.id] = user.fullName || user.email
            return acc
        }, {})
    }, [usersData?.users])

    const filteredByType = useMemo(() => {
        const allTransactions: FinanceTransaction[] = data?.transactions || []
        if (tabFilter === "ALL") return allTransactions
        if (tabFilter === "PENDING") return allTransactions.filter((tx) => tx.verifiedStatus === "PENDING")
        if (tabFilter === "REVENUE") return allTransactions.filter((tx) => tx.type === "DEPOSIT" && tx.orderId)
        if (tabFilter === "PAYMENT") return allTransactions.filter((tx) => tx.type === "PURCHASE")
        if (tabFilter === "DEPOSIT") return allTransactions.filter((tx) => tx.type === "DEPOSIT" && !tx.orderId)
        if (tabFilter === "WITHDRAW") return allTransactions.filter((tx) => tx.type === "WITHDRAW" && !tx.orderId)
        return allTransactions.filter((tx) => tx.type === tabFilter)
    }, [tabFilter, data?.transactions])

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
            userMap,
            openFinanceDetail: async (tx: FinanceTransaction) => {
                setIsDetailOpen(true)
                setIsDetailLoading(true)
                try {
                    setSelectedTx(tx)
                } finally {
                    setIsDetailLoading(false)
                }
            },
        },
    })

    useEffect(() => {
        if (search.id && data?.transactions) {
            const tx = data.transactions.find((t: FinanceTransaction) => t.id === search.id);
            if (tx) {
                setSelectedTx(tx);
                setIsDetailOpen(true);
            }
        }
    }, [search.id, data]);

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

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Phí rút tiền</CardTitle>
                        <CardDescription>Cập nhật phí áp dụng cho các giao dịch rút tiền.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
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
                        </div>
                        <div className="space-y-2">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Tiền nạp tối thiểu</CardTitle>
                        <CardDescription>Cấu hình số tiền nạp tối thiểu cho mỗi lần giao dịch.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="min-amount">Số tiền tối thiểu</Label>
                            <Input
                                id="min-amount"
                                type="number"
                                value={minDeposit.amount}
                                onChange={(e) =>
                                    setMinDeposit((prev) => ({
                                        ...prev,
                                        amount: Number(e.target.value),
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min-description">Mô tả</Label>
                            <Input
                                id="min-description"
                                placeholder="Ví dụ: Nạp tối thiểu 50,000đ"
                                value={minDeposit.description}
                                onChange={(e) =>
                                    setMinDeposit((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            disabled={minDepositMutation.isPending}
                            onClick={() => minDepositMutation.mutate(minDeposit)}
                        >
                            Lưu tiền nạp tối thiểu
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin ngân hàng</CardTitle>
                    <CardDescription>Cập nhật thông tin ngân hàng nhận tiền nạp.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-name">Tên ngân hàng</Label>
                            <Input
                                id="bank-name"
                                placeholder="Ví dụ: Vietcombank, MB Bank..."
                                value={bankInfo.bankName}
                                onChange={(e) => setBankInfo(p => ({ ...p, bankName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="acc-number">Số tài khoản</Label>
                            <Input
                                id="acc-number"
                                placeholder="Nhập số tài khoản"
                                value={bankInfo.accountNumber}
                                onChange={(e) => setBankInfo(p => ({ ...p, accountNumber: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="acc-owner">Chủ tài khoản</Label>
                            <Input
                                id="acc-owner"
                                placeholder="Nhập tên chủ tài khoản"
                                value={bankInfo.accountOwner}
                                onChange={(e) => setBankInfo(p => ({ ...p, accountOwner: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label>QR Code (Nạp tiền)</Label>
                        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/50">
                            <div className="relative aspect-square w-48 overflow-hidden rounded-md border bg-background">
                                {(qrPreview || (bankInfo.qrCodeUrl && !qrFile)) ? (
                                    <img
                                        src={qrPreview || `${import.meta.env.VITE_BASE_URL}${bankInfo.qrCodeUrl}`}
                                        alt="Bank QR Code"
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                                        <Upload className="h-8 w-8 mb-2" />
                                        <span className="text-xs">Chưa có mã QR</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex w-full items-center gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setQrFile(file)
                                            const reader = new FileReader()
                                            reader.onloadend = () => setQrPreview(reader.result as string)
                                            reader.readAsDataURL(file)
                                        }
                                    }}
                                    className="flex-1 cursor-pointer"
                                />
                                {(qrPreview || bankInfo.qrCodeUrl) && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            setQrFile(null)
                                            setQrPreview(null)
                                            setBankInfo(p => ({ ...p, qrCodeUrl: null }))
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">
                                Tải lên hình ảnh mã QR Code của ngân hàng để người dùng dễ dàng chuyển khoản.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/30 p-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        Lưu ý: Thông tin này sẽ hiển thị trực tiếp cho người dùng khi họ yêu cầu nạp tiền.
                    </p>
                    <Button
                        disabled={bankMutation.isPending}
                        onClick={() => bankMutation.mutate({ ...bankInfo, qrCode: qrFile || undefined })}
                    >
                        Lưu thông tin ngân hàng
                    </Button>
                </CardFooter>
            </Card>

            <ResponsiveDialog
                isOpen={isDetailOpen}
                setIsOpen={setIsDetailOpen}
                title="Chi tiết giao dịch"
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
                                <span className="font-semibold">Người dùng: </span>
                                <span>{userMap[selectedTx.userId] || selectedTx.userId}</span>
                            </div>
                            <div>
                                <span className="font-semibold">ID Tài khoản: </span>
                                <span>{selectedTx.accountId}</span>
                            </div>
                            <div>
                                <span className="font-semibold">Loại: </span>
                                <span>
                                    {selectedTx.type === "DEPOSIT" && selectedTx.orderId
                                        ? "Doanh thu"
                                        : selectedTx.type === "DEPOSIT"
                                        ? "Nạp tiền"
                                        : selectedTx.type === "WITHDRAW"
                                        ? "Rút tiền"
                                        : selectedTx.type === "PURCHASE"
                                        ? "Thanh toán"
                                        : selectedTx.type === "REFUND"
                                        ? "Hoàn tiền"
                                        : selectedTx.type}
                                </span>
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
                                        } catch {
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
                        case "revenue":
                            setTabFilter("REVENUE")
                            break
                        case "payment":
                            setTabFilter("PAYMENT")
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
                    <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
                    <TabsTrigger value="payment">Thanh toán</TabsTrigger>
                </TabsList>

                <Card className="bg-sidebar w-full mt-4 flex flex-col">
                    <CardHeader>
                        <CardTitle>
                            {tabFilter === "ALL" && "Tất cả giao dịch"}
                            {tabFilter === "DEPOSIT" && "Nạp tiền"}
                            {tabFilter === "WITHDRAW" && "Rút tiền"}
                            {tabFilter === "PENDING" && "Giao dịch chờ xử lý"}
                            {tabFilter === "REVENUE" && "Doanh thu"}
                            {tabFilter === "PAYMENT" && "Thanh toán"}
                        </CardTitle>
                        <CardDescription>
                            {tabFilter === "ALL" && "Tổng quan về tất cả các giao dịch tài chính."}
                            {tabFilter === "DEPOSIT" && "Chỉ các giao dịch nạp tiền manual."}
                            {tabFilter === "WITHDRAW" && "Chỉ các giao dịch rút tiền manual."}
                            {tabFilter === "PENDING" && "Các giao dịch đang chờ xác minh."}
                            {tabFilter === "REVENUE" && "Doanh thu từ các đơn hàng."}
                            {tabFilter === "PAYMENT" && "Các giao dịch thanh toán đơn hàng."}
                        </CardDescription>
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
                            {tabFilter === "ALL" && (
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="Tìm người dùng..."
                                        className="pl-8"
                                        value={(table.getColumn("userId")?.getFilterValue() as string) ?? ""}
                                        onChange={(e) => table.getColumn("userId")?.setFilterValue(e.target.value)}
                                    />
                                </div>
                            )}
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
            </Tabs>
        </div>
    )
}

