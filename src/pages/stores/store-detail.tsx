
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
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Hero Section with Banner */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-x">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-transparent"></div>

                {/* Back Button - Floating */}
                <div className="absolute top-6 left-6 z-20">
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => window.history.back()}
                        className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border-white/20 hover:bg-white/30 text-white shadow-xl transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end gap-6">
                        {/* Store Avatar/Logo Placeholder */}
                        <div className="relative shrink-0">
                            <div className="h-24 w-24 md:h-32 md:w-32 rounded-3xl bg-white p-1.5 shadow-2xl border-4 border-background overflow-hidden transform transition-transform hover:scale-105 duration-300">
                                <div className="h-full w-full rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                    <StoreIcon className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                                </div>
                            </div>
                            {store.isVerified && (
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-background shadow-lg">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2 mb-2">
                             <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                                    {store.name}
                                </h1>
                                <Badge variant="secondary" className="bg-white/90 text-primary font-black uppercase text-[12px] px-4 py-1.5 backdrop-blur-md border-none shadow-lg">
                                    {store.status === 'ACTIVE' ? 'Hoạt động' :
                                     store.status === 'REQUESTED' ? 'Chờ duyệt' :
                                     store.status === 'BANNED' ? 'Bị cấm' :
                                     store.status === 'REJECTED' ? 'Đã từ chối' : store.status}
                                </Badge>
                             </div>
                             <div className="flex items-center gap-6 text-white/80 font-medium">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 opacity-70" />
                                    <span>{store.ownerName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 opacity-70" />
                                    <span className="max-w-[300px] truncate">{store.address || 'Hà Nội, Việt Nam'}</span>
                                </div>
                             </div>
                        </div>

                        {/* Quick Actions in Hero */}
                        <div className="flex gap-3 mb-2">
                            {store.status === 'REQUESTED' && (
                                <>
                                    <Button
                                        onClick={() => verifyMutation.mutate()}
                                        disabled={verifyMutation.isPending}
                                        className="h-12 px-8 bg-white text-primary hover:bg-white/90 font-black rounded-2xl shadow-xl shadow-black/20"
                                    >
                                        Duyệt ngay
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => updateStatusMutation.mutate('REJECTED')}
                                        disabled={updateStatusMutation.isPending}
                                        className="h-12 px-6 bg-transparent text-white border-white/30 hover:bg-white/10 font-bold rounded-2xl backdrop-blur-md"
                                    >
                                        Từ chối
                                    </Button>
                                </>
                            )}
                            {store.status === 'ACTIVE' && (
                                <Button
                                    variant="destructive"
                                    onClick={() => updateStatusMutation.mutate('BANNED')}
                                    disabled={updateStatusMutation.isPending}
                                    className="h-12 px-8 font-black rounded-2xl shadow-xl shadow-destructive/20"
                                >
                                    Khóa cửa hàng
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-8 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Đơn hàng', value: '42K', icon: History, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Sản phẩm', value: '1.2K', icon: StoreIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                { label: 'Đánh giá', value: '4.9', icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                { label: 'Xác minh', value: 'Level 2', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            ].map((stat, i) => (
                                <Card key={i} className="border-none shadow-xl shadow-black/5 bg-white/70 backdrop-blur-xl transition-transform hover:scale-[1.02]">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
                                            <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* About Card */}
                        <Card className="border-none shadow-2xl shadow-primary/5 bg-white/80 backdrop-blur-md overflow-hidden rounded-[2rem]">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 p-8">
                                <CardTitle className="text-2xl font-black flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Info className="h-6 w-6 text-primary" />
                                    </div>
                                    Tổng quan cửa hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    <div className="p-8 space-y-4 border-b md:border-r border-muted/50 hover:bg-muted/30 transition-colors">
                                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary/40" /> Thông tin liên hệ
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold">{store.contactPhone || 'N/A'}</p>
                                            <p className="text-muted-foreground font-medium">{store.contactEmail || 'contact@store.com'}</p>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-4 border-b border-muted/50 hover:bg-muted/30 transition-colors">
                                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-primary/40" strokeWidth={3} /> Bảo mật & ID
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="text-xl font-mono font-bold text-primary">ID: {store.userId}</p>
                                            <p className="text-muted-foreground font-medium italic">Ngày đăng ký: 12/10/2023</p>
                                        </div>
                                    </div>
                                    <div className="p-8 md:col-span-2 space-y-6">
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                                                <StoreIcon className="h-4 w-4 text-primary/40" /> Câu chuyện thương hiệu
                                            </h3>
                                            <p className="text-lg leading-relaxed text-muted-foreground font-medium max-w-3xl">
                                                {store.description || 'Chưa cung cấp mô tả chi tiết cho cửa hàng này. Nội dung này sẽ giúp khách hàng hiểu rõ hơn về giá trị và sản phẩm của bạn.'}
                                            </p>
                                        </div>
                                        <Separator className="bg-muted/50" />
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {['Sản phẩm cao cấp', 'Giao hàng nhanh', 'Đổi trả 24h', 'Flash Sale'].map((tag) => (
                                                <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary border-none font-bold py-1.5 px-4 rounded-full">
                                                    #{tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Card */}
                        <Card className="border-none shadow-2xl shadow-primary/5 bg-gradient-to-br from-indigo-900 to-slate-900 overflow-hidden rounded-[2rem] text-white group">
                            <CardHeader className="border-b border-white/10 p-8 flex flex-row items-center justify-between relative z-10">
                                <CardTitle className="text-2xl font-black flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <CreditCard className="h-6 w-6 text-white" />
                                    </div>
                                    Tài khoản thanh toán
                                </CardTitle>
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black px-4 py-1.5 uppercase tracking-tighter shadow-lg">Liên kết</Badge>
                            </CardHeader>
                            <CardContent className="p-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 transition-transform group-hover:rotate-12 duration-700">
                                    <CreditCard size={300} strokeWidth={1} />
                                </div>
                                <div className="relative z-10 grid gap-12">
                                    <div className="flex flex-col md:flex-row gap-12 justify-between">
                                        <div className="space-y-4">
                                            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Tên ngân hàng</p>
                                            <div className="space-y-1">
                                                <h4 className="text-4xl font-black tracking-tight">{store.bankName || 'TP BANK'}</h4>
                                                <p className="text-indigo-300 font-black tracking-[0.2em] text-sm uppercase">{store.bankCode || 'TPB'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-end">
                                            <div className="h-16 w-24 rounded-xl bg-white/10 backdrop-blur-lg flex items-center justify-center border border-white/10 shadow-inner">
                                                <div className="flex -space-x-4">
                                                    <div className="h-10 w-10 rounded-full bg-red-500/80 mix-blend-screen overflow-hidden backdrop-blur-sm"></div>
                                                    <div className="h-10 w-10 rounded-full bg-amber-500/80 mix-blend-screen overflow-hidden backdrop-blur-sm"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/5">
                                        <div className="space-y-4">
                                            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Chủ tài khoản</p>
                                            <p className="text-2xl md:text-3xl font-black tracking-tight uppercase drop-shadow-lg">{store.accountHolderName || 'NGUYEN VAN A'}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Số tài khoản</p>
                                            <p className="text-3xl md:text-5xl font-black font-mono tracking-widest text-indigo-400 tabular-nums drop-shadow-glow">
                                                {store.accountNumber || '•••• 8888 9999'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Verification */}
                    <div className="space-y-8">
                        {/* Verification Status Card */}
                        <Card className="border-none shadow-2xl shadow-primary/5 bg-white overflow-hidden rounded-[2rem]">
                            <CardHeader className="p-8 border-b border-muted/50">
                                <CardTitle className="text-xl font-black flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 text-emerald-500" strokeWidth={3} /> Hồ sơ định danh
                                </CardTitle>
                                <CardDescription className="text-sm font-medium pt-1">Giấy tờ pháp lý & QR xác thực</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="space-y-8">
                                    {[
                                        { label: 'CCCD Mặt trước', id: 'kyc-front', tag: 'ID-F' },
                                        { label: 'CCCD Mặt sau', id: 'kyc-back', tag: 'ID-B' }
                                    ].map((item) => (
                                        <div key={item.id} className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">{item.label}</h3>
                                                <Badge variant="secondary" className="text-[10px] font-black">{item.tag}</Badge>
                                            </div>
                                            <div className="relative group rounded-3xl overflow-hidden border-2 border-muted transition-all hover:border-emerald-500 shadow-xl cursor-zoom-in">
                                                <SafeImage
                                                    src={`${mediaBaseUrl}/${item.id}`}
                                                    alt={item.label}
                                                    className="w-full h-56 object-cover bg-muted/40 transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" className="rounded-full shadow-lg font-black backdrop-blur-md bg-white/80">Phóng to</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Separator />

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Mã QR Thanh toán</h3>
                                            <Badge variant="outline" className="text-[10px] font-black border-primary">OFFICIAL</Badge>
                                        </div>
                                        <div className="relative max-w-[260px] mx-auto aspect-square p-6 bg-gradient-to-br from-white to-muted/50 rounded-[2.5rem] border-2 border-dashed border-primary/20 shadow-xl group hover:border-primary/50 transition-colors">
                                            <div className="w-full h-full p-6 bg-white rounded-3xl shadow-inner relative overflow-hidden flex items-center justify-center">
                                                <div className="absolute -top-12 -right-12 h-32 w-32 bg-primary/5 rounded-full blur-2xl"></div>
                                                <SafeImage
                                                    src={`${mediaBaseUrl}/payment-qr`}
                                                    alt="Payment QR"
                                                    className="w-full h-full object-contain relative z-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Card */}
                        <Card className="border-none shadow-2xl bg-indigo-50/50 rounded-[2rem] overflow-hidden">
                             <div className="p-8 space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black flex items-center gap-2">
                                        <History className="h-5 w-5 text-indigo-400" /> Hoạt động gần đây
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500">Dấu vết hệ thống & Bảo mật</p>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { event: 'Cập nhật tài khoản', time: '10 phút trước', icon: CreditCard, color: 'indigo' },
                                        { event: 'Duyệt hồ sơ KYC', time: '2 giờ trước', icon: ShieldCheck, color: 'emerald' },
                                        { event: 'Đăng ký cửa hàng', time: '5 tháng trước', icon: StoreIcon, color: 'purple' },
                                    ].map((activity, i) => (
                                        <div key={i} className="flex gap-4 relative">
                                            {i !== 2 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-slate-200"></div>}
                                            <div className={`h-6 w-6 rounded-full bg-white shadow-sm border-2 border-${activity.color}-200 flex items-center justify-center relative z-10 shrink-0`}>
                                                <activity.icon className={`h-3 w-3 text-${activity.color}-500`} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[13px] font-black tracking-tight">{activity.event}</p>
                                                <p className="text-[11px] font-bold text-slate-400 italic">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Global Aesthetics - Tailwind Config Extension would be better, but we use inline styles for rich animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 15s ease infinite;
                }
                .drop-shadow-glow {
                    filter: drop-shadow(0 0 10px rgba(129, 140, 248, 0.4));
                }
            `}} />
        </div>


    );
}
