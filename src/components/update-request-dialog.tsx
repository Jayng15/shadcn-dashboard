
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"

interface UpdateRequestDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  request: any
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
    try {
      setIsLoading(true)
      const endpoint = type === "STORE"
        ? `/store/admin/updates/${request.id}/approve`
        : `/product/admin/updates/${request.id}/approve`

      await api.post(endpoint)
      toast.success("Request approved successfully")
      setIsOpen(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }

    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    try {
      setIsLoading(true)
      const endpoint = type === "STORE"
        ? `/store/admin/updates/${request.id}/reject`
        : `/product/admin/updates/${request.id}/reject`

      await api.post(endpoint, { reason: rejectReason })
      toast.success("Request rejected successfully")
      setIsOpen(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reject request")
    } finally {
      setIsLoading(false)
      setShowRejectInput(false)
      setRejectReason("")
    }
  }

  if (!request) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Update Request</DialogTitle>
          <DialogDescription>
            Review the changes requested by the {type.toLowerCase()} owner.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-4">
            <div>
                <h4 className="mb-2 text-sm font-medium">Request Details</h4>
                <div className="text-sm text-muted-foreground">
                    <p>Request ID: {request.id}</p>
                    <p>Target ID: {request.targetId}</p>
                    <p>Created At: {new Date(request.createdAt).toLocaleString()}</p>
                </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Proposed Changes (JSON Payload)</h4>
                <div className="space-y-4">
                  {(() => {
                    let payload = request.payload;
                    try {
                      if (typeof payload === 'string') {
                        // Handle double-stringified JSON if necessary, though simpler is often better
                        // But here we suspect it might be a stringified object
                        const parsed = JSON.parse(payload);
                        // If parsing succeeded, use it
                        payload = parsed;
                      }
                    } catch (e) {
                      // fallback to original
                    }

                    if (typeof payload !== 'object' || payload === null) {
                        return <div className="text-sm">{String(payload)}</div>
                    }

                    const formatKey = (key: string) => {
                      return key
                        .replace(/([A-Z])/g, ' $1') // insert space before caps
                        .replace(/^./, (str) => str.toUpperCase()); // capitalize first letter
                    };

                    const renderValue = (value: any): React.ReactNode => {
                        if (typeof value === 'object' && value !== null) {
                             return (
                                <div className="pl-4 border-l-2 border-muted mt-1 space-y-2">
                                    {Object.entries(value).map(([subKey, subValue]) => (
                                        <div key={subKey}>
                                            <span className="font-semibold text-xs text-muted-foreground">{formatKey(subKey)}:</span>
                                            <div className="text-sm">{renderValue(subValue)}</div>
                                        </div>
                                    ))}
                                </div>
                             )
                        }
                        if (String(value).match(/\.(jpeg|jpg|gif|png|webp)$/i) || (typeof value === 'string' && value.startsWith('/uploads'))) {
                             return (
                                 <img src={value as string} alt="Preview" className="w-24 h-24 object-cover rounded mt-1 border" />
                             )
                        }
                        return <span className="ml-1">{String(value)}</span>
                    };

                    return Object.entries(payload).map(([key, value]) => (
                      <div key={key} className="border-b pb-2 last:border-0">
                        <span className="font-semibold text-sm">{formatKey(key)}</span>
                        <div className="mt-1 text-sm text-foreground">
                            {renderValue(value)}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
            </div>
          </div>
        </ScrollArea>

        {showRejectInput && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium">Rejection Reason</h4>
            <Textarea
              placeholder="Why are you rejecting this request?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        )}

        <DialogFooter className="mt-4 sm:justify-end gap-2">
            {!showRejectInput && (
                <>
                <Button
                    variant="destructive"
                    onClick={() => setShowRejectInput(true)}
                    disabled={isLoading}
                >
                    Reject
                </Button>
                <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve
                </Button>
                </>
            )}

            {showRejectInput && (
                <>
                <Button
                    variant="ghost"
                    onClick={() => setShowRejectInput(false)}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Reject
                </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
