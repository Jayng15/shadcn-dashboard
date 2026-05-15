
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"
import api from "@/lib/api"
import { Loader2, Info, Calendar, Edit3, ArrowRight, CheckCircle2, XCircle, AlertCircle, Package, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { exactImageUrl } from "@/lib/utils"
import { SafeImage } from "@/components/safe-image"

export interface UpdateRequest {
  id: string
  targetId: string
  createdAt: string
  payload: Record<string, unknown> | null
  [key: string]: unknown
}

interface UpdateRequestDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  request: UpdateRequest | null
  onSuccess: () => void
  type: "STORE" | "PRODUCT"
}

export function UpdateRequestDialog({
  isOpen,
  setIsOpen,
  request,
  onSuccess,
  type,
}: UpdateRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectInput, setShowRejectInput] = useState(false)

  const handleApprove = async () => {
    if (!request) return;
    try {
      setIsLoading(true)
      const endpoint = type === "STORE"
        ? `/storeupdates/${request.id}/approve`
        : `/productupdates/${request.id}/approve`

      await api.post(endpoint)
      toast.success("Đã phê duyệt thay đổi")
      setIsOpen(false)
      onSuccess()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Không thể phê duyệt yêu cầu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!request) return;
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }

    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối")
      return
    }

    try {
      setIsLoading(true)
      const endpoint = type === "STORE"
        ? `/storeupdates/${request.id}/reject`
        : `/productupdates/${request.id}/reject`

      await api.post(endpoint, { reason: rejectReason })
      toast.success("Đã từ chối yêu cầu")
      setIsOpen(false)
      onSuccess()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Không thể từ chối yêu cầu")
    } finally {
      setIsLoading(false)
      setShowRejectInput(false)
      setRejectReason("")
    }
  }

  if (!request) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl bg-card">
        <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Xem xét yêu cầu cập nhật</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Xem xét các thay đổi được yêu cầu bởi chủ sở hữu {type === 'STORE' ? 'cửa hàng' : 'sản phẩm'}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="space-y-6">
            {/* Metadata section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-muted-foreground/10 text-[11px]">
              <div className="space-y-2 font-medium">
                <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                  <Info className="h-3 w-3" /> Chi tiết hệ thống
                </div>
                <div className="flex justify-between items-center mr-4">
                  <span className="text-muted-foreground">ID Yêu cầu:</span>
                  <span className="font-mono text-primary select-all bg-background px-1.5 py-0.5 rounded border border-primary/20">{request.id}</span>
                </div>
                <div className="flex justify-between items-center mr-4">
                  <span className="text-muted-foreground">ID {type === 'STORE' ? 'Cửa hàng' : 'Sản phẩm'}:</span>
                  <span className="font-mono text-primary select-all bg-background px-1.5 py-0.5 rounded border border-primary/20">{request.targetId}</span>
                </div>
              </div>
              <div className="space-y-2 font-medium border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
                <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                  <Calendar className="h-3 w-3" /> Thời gian gửi
                </div>
                <div className="text-foreground text-[13px]">
                   {new Intl.DateTimeFormat('vi-VN', {
                     dateStyle: 'medium',
                     timeStyle: 'short'
                   }).format(new Date(request.createdAt))}
                </div>
                <div className="text-[11px] text-muted-foreground italic">
                  Gửi {new Intl.RelativeTimeFormat('vi', { numeric: 'auto' }).format(
                    Math.round((new Date(request.createdAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                    'day'
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                {type === 'STORE' ? <Store className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                Nội dung thay đổi
              </h4>

              <div className="space-y-1 rounded-xl border overflow-hidden bg-background shadow-inner">
                {(() => {
                  let payload = request.payload;
                    try {
                      if (typeof payload === 'string') {
                        payload = JSON.parse(payload);
                      }
                    } catch {
                      // Silently skip if not JSON
                    }

                  if (typeof payload !== 'object' || payload === null) {
                    return <div className="p-4 text-sm italic bg-muted/10 text-muted-foreground">{String(payload)}</div>
                  }

                  const formatKey = (key: string) => {
                    const mappings: Record<string, string> = {
                      name: "Tên",
                      description: "Mô tả",
                      price: "Giá bán",
                      thumbnailUrl: "Ảnh đại diện/Ảnh bìa",
                      images: "Hình ảnh khác",
                      stock: "Tồn kho",
                      address: "Địa chỉ",
                      contactPhone: "Số điện thoại",
                      contactEmail: "Email",
                      bankName: "Tên ngân hàng",
                      accountNumber: "Số tài khoản",
                      accountHolderName: "Chủ tài khoản",
                      category: "Danh mục",
                      tags: "Thẻ",
                      status: "Trạng thái",
                      isVerified: "Xác minh"
                    };

                    if (mappings[key]) return mappings[key];

                    return key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());
                  };

                  const renderValue = (value: unknown, key: string): React.ReactNode => {
                    const val = value as unknown;
                    const strVal = String(value);
                    if (Array.isArray(val)) {
                      return (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {val.map((v, i) => (
                            <div key={i} className="rounded-md border p-1 bg-muted/10">
                              {renderValue(v, key)}
                            </div>
                          ))}
                        </div>
                      )
                    }
                    if (typeof val === 'object' && val !== null) {
                      return (
                        <div className="pl-3 border-l-2 border-primary/20 mt-1 space-y-2 py-1 ml-1">
                          {Object.entries(val as Record<string, unknown>).map(([subKey, subValue]) => (
                            <div key={subKey} className="flex flex-col gap-0.5 text-left">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{formatKey(subKey)}</span>
                              <div className="text-sm text-foreground">{renderValue(subValue, subKey)}</div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) {
                      return (
                        <div className="mt-1 relative group overflow-hidden rounded-lg border bg-muted/20 w-full max-w-[200px] aspect-video">
                          <SafeImage 
                            src={exactImageUrl(val)} 
                            alt={key}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      )
                    }

                    if (typeof value === 'boolean') {
                      return <Badge variant={value ? "default" : "secondary"} className="h-5 text-[10px] uppercase">{value ? "Bật" : "Tắt"}</Badge>
                    }

                    if ((typeof value === 'number' || !isNaN(Number(value))) && key.toLowerCase().includes('price')) {
                      return <span className="font-mono text-primary font-bold">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))}
                      </span>
                    }

                    return <span className="font-medium whitespace-pre-wrap leading-relaxed">{strVal}</span>
                  };

                  return Object.entries(payload).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4 p-4 border-b last:border-0 hover:bg-muted/5 transition-colors">
                      <div className="flex flex-col gap-1 min-w-[150px] shrink-0">
                        <span className="font-bold text-[11px] text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                          <ArrowRight className="h-3 w-3 text-primary/40" /> {formatKey(key)}
                        </span>
                      </div>
                      <div className="flex-1 w-full text-left sm:text-right flex justify-start sm:justify-end overflow-hidden">
                        {renderValue(value, key)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-muted/10">
          {showRejectInput ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 text-destructive font-bold text-[11px] uppercase tracking-widest">
                <AlertCircle className="h-3.5 w-3.5" /> Lý do từ chối
              </div>
              <Textarea
                placeholder="Nhập lý do tại sao bạn từ chối yêu cầu này. Người dùng sẽ nhận được lý do này."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-background min-h-[100px] border-destructive/20 focus-visible:ring-destructive resize-none p-3 text-sm"
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRejectInput(false)
                    setRejectReason("")
                  }}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={isLoading}
                  className="shadow-lg shadow-destructive/20 px-6"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive shadow-sm h-11"
                onClick={() => setShowRejectInput(true)}
                disabled={isLoading}
              >
                <XCircle className="mr-2 h-4 w-4" strokeWidth={2.5} /> Từ chối
              </Button>
              <Button
                className="flex-1 shadow-lg shadow-primary/20 brightness-105 hover:brightness-100 transition-all font-bold h-11"
                onClick={handleApprove}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" strokeWidth={2.5} />
                )}
                Phê duyệt
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
