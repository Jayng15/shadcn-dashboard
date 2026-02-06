
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SafeImage } from "@/components/safe-image";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Ban } from "lucide-react";

export default function StoreDetailPage() {
    // Correct way to get params in TanStack Router depends on the route definition.
    // Assuming file route 'stores/$storeId' provides params.
    // However, createLazyFileRoute used in index won't strictly type access here unless generated.
    // We can use `useParams({ from: ... })` if we knew the route ID, OR just generic useParams.
    const { storeId } = useParams({ strict: false }) as { storeId: string };
    // const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { isPending, error, data } = useQuery({
        queryKey: ["store", storeId],
        queryFn: async () => {
            const res = await api.get(`/store/detail/${storeId}`);
            return res.data.store;
        },
        enabled: !!storeId,
    });

    const verifyMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/store/${storeId}/verify`);
        },
        onSuccess: () => {
            toast.success("Store verified successfully");
            queryClient.invalidateQueries({ queryKey: ["store", storeId] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Verification failed");
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            await api.patch(`/store/${storeId}/status`, { status });
        },
        onSuccess: (_, status) => {
            toast.success(`Store status updated to ${status}`);
            queryClient.invalidateQueries({ queryKey: ["store", storeId] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Status update failed");
        }
    });

    if (isPending) return <div className="p-8">Loading store details...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {(error as Error).message}</div>;
    if (!data) return <div className="p-8">Store not found</div>;

    const store = data;
    const mediaBaseUrl = `/store/${storeId}/media`;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {store.name}
                        <Badge variant={store.status === 'ACTIVE' ? 'default' : 'secondary'}>{store.status}</Badge>
                        {store.isVerified && <Badge variant="outline" className="border-green-500 text-green-500">Verified</Badge>}
                    </h1>
                    <p className="text-muted-foreground text-sm">Owner: {store.ownerName} ({store.userId})</p>
                </div>
                <div className="flex gap-2">
                    {store.status === 'REQUESTED' && (
                        <>
                            <Button
                                variant="default"
                                onClick={() => verifyMutation.mutate()}
                                disabled={verifyMutation.isPending}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" /> Verify Store
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => updateStatusMutation.mutate('REJECTED')}
                                disabled={updateStatusMutation.isPending}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                        </>
                    )}
                    {store.status === 'ACTIVE' && (
                         <Button
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate('BANNED')}
                            disabled={updateStatusMutation.isPending}
                        >
                            <Ban className="mr-2 h-4 w-4" /> Ban Store
                        </Button>
                    )}
                     {store.status === 'BANNED' && (
                         <Button
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate('ACTIVE')}
                            disabled={updateStatusMutation.isPending}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Unban
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* General Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Contact Phone</h3>
                                <p>{store.contactPhone || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Contact Email</h3>
                                <p>{store.contactEmail || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Address</h3>
                                <p>{store.address || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Description</h3>
                                <p>{store.description || 'N/A'}</p>
                            </div>
                        </div>

                        <Separator />
                        <h3 className="font-semibold">Bank Information</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Bank Name</h3>
                                <p>{store.bankName || 'N/A'}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Bank Code</h3>
                                <p>{store.bankCode || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Account Holder</h3>
                                <p>{store.accountHolderName || 'N/A'}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Account Number</h3>
                                <p>{store.accountNumber || 'N/A'}</p>
                            </div>
                         </div>
                    </CardContent>
                </Card>

                {/* Identity & Images */}
                <Card>
                    <CardHeader>
                        <CardTitle>Verification Documents</CardTitle>
                        <CardDescription>KYC and Payment Images</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">KYC Front</h3>
                            <SafeImage
                                src={`${mediaBaseUrl}/kyc-front`}
                                alt="KYC Front"
                                className="w-full h-40 object-cover rounded-md border"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">KYC Back</h3>
                            <SafeImage
                                src={`${mediaBaseUrl}/kyc-back`}
                                alt="KYC Back"
                                className="w-full h-40 object-cover rounded-md border"
                            />
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Payment QR</h3>
                            <SafeImage
                                src={`${mediaBaseUrl}/payment-qr`}
                                alt="Payment QR"
                                className="w-full h-40 object-cover rounded-md border"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
