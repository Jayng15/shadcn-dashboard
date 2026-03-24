
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
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-8">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 py-6 border-b -mx-4 md:-mx-8 px-4 md:px-8">
                <div className="flex items-center gap-6">
                    <Button variant="outline" size="icon" onClick={() => window.history.back()} className="h-10 w-10 shrink-0 shadow-sm border-muted-foreground/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                {store.name}
                            </h1>
                            <div className="flex gap-2">
                                <Badge variant={store.status === 'ACTIVE' ? 'default' : 'secondary'} className="uppercase text-[11px] font-bold px-3 py-0.5">
                                    {store.status === 'ACTIVE' ? 'Hoạt động' : 
                                     store.status === 'REQUESTED' ? 'Chờ duyệt' :
                                     store.status === 'BANNED' ? 'Bị cấm' :
                                     store.status === 'REJECTED' ? 'Đã từ chối' : store.status}
                                </Badge>
                                {store.isVerified && (
                                    <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50/50 text-[11px] font-bold px-3 py-0.5">
                                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Xác minh
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
                            <User className="h-4 w-4 text-primary/60" /> 
                            <span>Chủ sở hữu: <span className="font-bold text-foreground">{store.ownerName}</span></span>
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded border border-muted-foreground/10">ID: {store.userId}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {store.status === 'REQUESTED' && (
                        <>
                            <Button
                                variant="default"
                                size="lg"
                                onClick={() => verifyMutation.mutate()}
                                disabled={verifyMutation.isPending}
                                className="shadow-lg shadow-primary/20 brightness-105 font-bold h-12 px-6"
                            >
                                <CheckCircle className="mr-2 h-5 w-5" /> Duyệt cửa hàng
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => updateStatusMutation.mutate('REJECTED')}
                                disabled={updateStatusMutation.isPending}
                                className="text-destructive border-destructive/20 hover:bg-destructive/10 h-12 px-6"
                            >
                                <XCircle className="mr-2 h-5 w-5" /> Từ chối
                            </Button>
                        </>
                    )}
                    {store.status === 'ACTIVE' && (
                         <Button
                            variant="destructive"
                            size="lg"
                            onClick={() => updateStatusMutation.mutate('BANNED')}
                            disabled={updateStatusMutation.isPending}
                            className="shadow-lg shadow-destructive/20 font-bold h-12 px-8"
                        >
                            <Ban className="mr-2 h-5 w-5" /> Khóa cửa hàng
                        </Button>
                    )}
                     {store.status === 'BANNED' && (
                         <Button
                            variant="outline"
                            size="lg"
                            onClick={() => updateStatusMutation.mutate('ACTIVE')}
                            disabled={updateStatusMutation.isPending}
                            className="border-primary text-primary hover:bg-primary/5 font-bold h-12 px-8"
                        >
                            <CheckCircle className="mr-2 h-5 w-5" /> Mở khóa
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Information */}
                    <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b py-6 px-8">
                            <CardTitle className="text-lg flex items-center gap-3 font-bold">
                                <Info className="h-5 w-5 text-primary" strokeWidth={2.5} /> Thông tin chung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-8 space-y-2 border-b md:border-r border-muted/50 transition-colors hover:bg-primary/5">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-primary/40" /> Số điện thoại
                                    </h3>
                                    <p className="text-lg font-bold">{store.contactPhone || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="p-8 space-y-2 border-b border-muted/50 transition-colors hover:bg-primary/5">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-primary/40" /> Email liên hệ
                                    </h3>
                                    <p className="text-lg font-bold truncate">{store.contactEmail || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="p-8 space-y-2 md:col-span-2 border-b border-muted/50 bg-muted/5 transition-colors hover:bg-primary/5">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary/40" /> Địa chỉ kinh doanh
                                    </h3>
                                    <p className="text-lg font-medium leading-relaxed">{store.address || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="p-8 space-y-4 md:col-span-2 bg-gradient-to-b from-transparent to-background/50">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2 text-primary">
                                        <StoreIcon className="h-4 w-4" /> Mô tả cửa hàng
                                    </h3>
                                    <p className="text-base leading-relaxed text-balance opacity-90">{store.description || 'Không có mô tả chi tiết'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Information */}
                    <Card className="overflow-hidden border-none shadow-xl shadow-primary/5">
                        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b py-6 px-8">
                            <CardTitle className="text-lg flex items-center gap-3 font-bold">
                                <CreditCard className="h-5 w-5 text-primary" strokeWidth={2.5} /> Thông tin thanh toán
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                             <div className="bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent rounded-2xl border border-primary/10 p-10 space-y-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5 transition-transform group-hover:scale-110 duration-500">
                                    <CreditCard className="h-40 w-40 text-primary" />
                                </div>
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em] opacity-60">Ngân hàng</span>
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-3xl font-black text-primary tracking-tighter uppercase">
                                                {store.bankName || 'N/A'}
                                            </h4>
                                            <Badge variant="outline" className="font-mono text-xs font-bold uppercase bg-background px-3 py-1 border-primary/20">
                                                {store.bankCode || 'CODE'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/10">
                                        <CreditCard className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 border-t border-primary/5 pt-10">
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em] opacity-60">Chủ tài khoản</span>
                                        <p className="text-2xl font-black uppercase tracking-tight text-foreground/80">{store.accountHolderName || 'Chưa cập nhật'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em] opacity-60">Số tài khoản</span>
                                        <p className="text-3xl font-black font-mono tracking-[0.1em] text-primary tabular-nums break-all">
                                            {store.accountNumber || '••••••••••••'}
                                        </p>
                                    </div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Identity & Verification Column */}
                <div className="space-y-8">
                    <Card className="border-none shadow-xl bg-card">
                        <CardHeader className="py-6 px-8 border-b">
                            <CardTitle className="text-lg flex items-center gap-3 font-bold">
                                <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={2.5} /> Hồ sơ xác minh
                            </CardTitle>
                            <CardDescription className="text-sm">Giấy tờ định danh & Thanh toán chính thức</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center justify-between tracking-widest">
                                        CCCD Mặt trước
                                        <Badge variant="secondary" className="text-[10px] font-bold px-2">KYC-F</Badge>
                                    </h3>
                                    <div className="relative group rounded-2xl overflow-hidden border-2 border-muted transition-all hover:border-primary/50 shadow-lg">
                                        <SafeImage
                                            src={`${mediaBaseUrl}/kyc-front`}
                                            alt="KYC Front"
                                            className="w-full h-56 object-cover bg-muted/20"
                                        />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center justify-between tracking-widest">
                                        CCCD Mặt sau
                                        <Badge variant="secondary" className="text-[10px] font-bold px-2">KYC-B</Badge>
                                    </h3>
                                    <div className="relative group rounded-2xl overflow-hidden border-2 border-muted transition-all hover:border-primary/50 shadow-lg">
                                        <SafeImage
                                            src={`${mediaBaseUrl}/kyc-back`}
                                            alt="KYC Back"
                                            className="w-full h-56 object-cover bg-muted/20"
                                        />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                 <Separator className="opacity-50" />
                                 <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center justify-between tracking-widest">
                                        Mã QR Thanh toán
                                        <Badge variant="outline" className="text-[10px] font-bold px-2 border-primary/20">PAY-QR</Badge>
                                    </h3>
                                    <div className="relative aspect-square max-w-[240px] mx-auto overflow-hidden rounded-2xl border-[3px] border-dashed border-primary/20 p-3 bg-muted/5 group transition-colors hover:bg-primary/5">
                                        <div className="w-full h-full p-4 bg-white rounded-xl shadow-inner border border-primary/5">
                                            <SafeImage
                                                src={`${mediaBaseUrl}/payment-qr`}
                                                alt="Payment QR"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata / Logs */}
                    <Card className="bg-primary/5 border-none shadow-inner overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <History className="h-20 w-20 text-primary" />
                        </div>
                        <CardContent className="p-8 space-y-4 relative z-10">
                             <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-black uppercase flex items-center gap-2 italic tracking-wider">
                                    <History className="h-4 w-4 text-primary/40" /> Cập nhật lần cuối
                                </span>
                                <span className="font-bold text-primary">{new Date().toLocaleDateString('vi-VN')}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs pt-4 border-t border-primary/10">
                                <span className="text-muted-foreground font-black uppercase flex items-center gap-2 italic tracking-wider">
                                    <ShieldCheck className="h-4 w-4 text-primary/40" /> Xác minh lúc
                                </span>
                                <span className="font-bold">{store.isVerified ? '20-03-2024' : 'Chưa xác minh'}</span>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

    );
}
