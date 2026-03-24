
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
import { useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SafeImage } from "@/components/safe-image";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Ban, Phone, Mail, MapPin, Info, CreditCard, ShieldCheck, User, Store as StoreIcon, History } from "lucide-react";

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
        <div className="space-y-6 pb-10">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 py-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3">
                        <ArrowLeft className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Quay lại</span>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
                            {store.name}
                            <Badge variant={store.status === 'ACTIVE' ? 'default' : 'secondary'} className="uppercase text-[10px] py-0">
                                {store.status === 'ACTIVE' ? 'Hoạt động' : 
                                 store.status === 'REQUESTED' ? 'Chờ duyệt' :
                                 store.status === 'BANNED' ? 'Bị cấm' :
                                 store.status === 'REJECTED' ? 'Đã từ chối' : store.status}
                            </Badge>
                            {store.isVerified && (
                                <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50/50 text-[10px] py-0">
                                    <CheckCircle className="mr-1 h-3 w-3" /> Đã xác minh
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" /> Chủ sở hữu: <span className="font-medium text-foreground">{store.ownerName}</span> 
                            <span className="text-[10px] font-mono bg-muted px-1 rounded ml-1 tracking-tighter">({store.userId})</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {store.status === 'REQUESTED' && (
                        <>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => verifyMutation.mutate()}
                                disabled={verifyMutation.isPending}
                                className="shadow-sm transition-all"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" /> Duyệt cửa hàng
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate('REJECTED')}
                                disabled={updateStatusMutation.isPending}
                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Từ chối
                            </Button>
                        </>
                    )}
                    {store.status === 'ACTIVE' && (
                         <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate('BANNED')}
                            disabled={updateStatusMutation.isPending}
                            className="shadow-sm"
                        >
                            <Ban className="mr-2 h-4 w-4" /> Khóa cửa hàng
                        </Button>
                    )}
                     {store.status === 'BANNED' && (
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate('ACTIVE')}
                            disabled={updateStatusMutation.isPending}
                            className="border-primary text-primary hover:bg-primary/5"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Mở khóa
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Information Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Information */}
                    <Card className="overflow-hidden border-primary/5 shadow-sm">
                        <CardHeader className="bg-muted/30 border-b py-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" /> Thông tin chung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-4 space-y-1 border-b md:border-r border-muted/50">
                                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        <Phone className="h-3 w-3" /> Số điện thoại
                                    </h3>
                                    <p className="font-medium">{store.contactPhone || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="p-4 space-y-1 border-b border-muted/50">
                                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        <Mail className="h-3 w-3" /> Email liên hệ
                                    </h3>
                                    <p className="font-medium">{store.contactEmail || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="p-4 space-y-1 md:col-span-2 border-b border-muted/50 bg-muted/5">
                                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3" /> Địa chỉ kinh doanh
                                    </h3>
                                    <p className="leading-relaxed">{store.address || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="p-4 space-y-1 md:col-span-2">
                                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        <StoreIcon className="h-3 w-3" /> Mô tả cửa hàng
                                    </h3>
                                    <p className="text-sm leading-relaxed text-balance">{store.description || 'Không có mô tả chi tiết'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Information */}
                    <Card className="overflow-hidden border-primary/5 shadow-sm">
                        <CardHeader className="bg-muted/30 border-b py-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" /> Thông tin thanh toán
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                             <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/10 p-6 space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Ngân hàng</span>
                                        <h4 className="text-xl font-black text-primary flex items-center gap-2">
                                            {store.bankName || 'N/A'}
                                            <Badge variant="outline" className="font-mono text-[10px] font-normal uppercase bg-background">
                                                {store.bankCode || 'CODE'}
                                            </Badge>
                                        </h4>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Chủ tài khoản</span>
                                        <p className="text-lg font-bold uppercase tracking-tight">{store.accountHolderName || 'Chưa cập nhật'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Số tài khoản</span>
                                        <p className="text-2xl font-black font-mono tracking-[0.2em] text-primary tabular-nums">
                                            {store.accountNumber || '••••••••••••'}
                                        </p>
                                    </div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Identity & Verification Column */}
                <div className="space-y-6">
                    <Card className="border-primary/5 shadow-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" /> Hồ sơ xác minh
                            </CardTitle>
                            <CardDescription>Giấy tờ định danh & Thanh toán</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center justify-between">
                                        CCCD Mặt trước
                                        <Badge variant="secondary" className="text-[9px] font-normal">KYC-F</Badge>
                                    </h3>
                                    <SafeImage
                                        src={`${mediaBaseUrl}/kyc-front`}
                                        alt="KYC Front"
                                        className="w-full h-44 object-cover rounded-xl border border-muted shadow-inner bg-muted/20"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center justify-between">
                                        CCCD Mặt sau
                                        <Badge variant="secondary" className="text-[9px] font-normal">KYC-B</Badge>
                                    </h3>
                                    <SafeImage
                                        src={`${mediaBaseUrl}/kyc-back`}
                                        alt="KYC Back"
                                        className="w-full h-44 object-cover rounded-xl border border-muted shadow-inner bg-muted/20"
                                    />
                                </div>
                                 <Separator />
                                 <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center justify-between">
                                        Mã QR Thanh toán
                                        <Badge variant="outline" className="text-[9px] font-normal">PAY-QR</Badge>
                                    </h3>
                                    <div className="relative aspect-square max-w-[200px] mx-auto overflow-hidden rounded-xl border-2 border-dashed border-primary/20 p-2 bg-muted/10 group">
                                        <SafeImage
                                            src={`${mediaBaseUrl}/payment-qr`}
                                            alt="Payment QR"
                                            className="w-full h-full object-contain rounded-lg shadow-sm bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata / Logs */}
                    <Card className="bg-muted/10 border-dashed">
                        <CardContent className="p-4 space-y-3">
                             <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground font-bold uppercase flex items-center gap-1.5 italic">
                                    <History className="h-3 w-3" /> Cập nhật lần cuối
                                </span>
                                <span className="font-medium">{new Date().toLocaleDateString('vi-VN')}</span>
                             </div>
                             <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground font-bold uppercase flex items-center gap-1.5 italic">
                                    <ShieldCheck className="h-3 w-3" /> Đã xác minh lúc
                                </span>
                                <span className="font-medium">{store.isVerified ? '20-03-2024' : 'Chưa xác minh'}</span>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
