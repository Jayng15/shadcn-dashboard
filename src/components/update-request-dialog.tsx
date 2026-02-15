
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
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                {(() => {
                  let payload = request.payload;
                  try {
                    if (typeof payload === 'string') {
                      payload = JSON.parse(payload);
                    }
                  } catch (e) {
                    // If parsing fails, use original payload
                  }
                  return JSON.stringify(payload, null, 2);
                })()}
              </pre>
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
