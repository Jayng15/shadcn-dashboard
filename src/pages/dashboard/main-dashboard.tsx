import { User, Store as StoreIcon, ShoppingBag, Activity, AlertCircle, PackageCheck, CreditCard, ClipboardList, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "@tanstack/react-router";
import CardStatistic from "./components/card-statistic";

interface DashboardData {
    users: number;
    stores: number;
    products: number;
    activeStores: number;
    storesToVerify: Store[];
    productsToVerify: Product[];
    transactionsToVerify: FinanceTransaction[];
    newOrders: Order[];
}

import { type Store } from "../stores/components/columns";
import { type Product } from "../products/components/columns";
import { type FinanceTransaction } from "../finance/components/columns";
import { type Order } from "../order/components/columns";

export default function MainDashoard() {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData>({
        users: 0,
        stores: 0,
        products: 0,
        activeStores: 0,
        storesToVerify: [],
        productsToVerify: [],
        transactionsToVerify: [],
        newOrders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    usersResponse,
                    storesResponse,
                    activeStoresResponse,
                    productsResponse,
                    storesToVerifyResponse,
                    productsToVerifyResponse,
                    transactionsToVerifyResponse,
                    newOrdersResponse
                ] = await Promise.all([
                    api.get('/user/list', { params: { limit: 1 } }),
                    api.get('/store', { params: { limit: 1 } }),
                    api.get('/store', { params: { limit: 1, status: 'ACTIVE' } }),
                    api.get('/product', { params: { limit: 1, isAdminView: true } }),
                    api.get('/store', { params: { limit: 10, status: 'REQUESTED' } }),
                    api.get('/product', { params: { limit: 10, status: 'REQUESTED', isAdminView: true } }),
                    api.get('/financetransactions', { params: { limit: 10, verifiedStatus: 'PENDING' } }),
                    api.get('/order/admin', { params: { limit: 10, status: 'PENDING' } })
                ]);

                setData({
                    users: usersResponse.data.pagination.total,
                    stores: storesResponse.data.pagination.total,
                    products: productsResponse.data.pagination.total,
                    activeStores: activeStoresResponse.data.pagination.total,
                    storesToVerify: storesToVerifyResponse.data.stores || [],
                    productsToVerify: productsToVerifyResponse.data.products || [],
                    transactionsToVerify: transactionsToVerifyResponse.data.transactions || [],
                    newOrders: newOrdersResponse.data.orders || []
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const cardStatictisData = [
        {
            title: "Tổng số người dùng",
            icon: User,
            value: loading ? "..." : data.users,
            description: "Người dùng đã đăng ký"
        },
        {
            title: "Tổng số cửa hàng",
            icon: StoreIcon,
            value: loading ? "..." : data.stores,
            description: "Tất cả cửa hàng"
        },
        {
            title: "Cửa hàng đang hoạt động",
            icon: Activity,
            value: loading ? "..." : data.activeStores,
            description: "Cửa hàng hiện đang hoạt động"
        },
        {
            title: "Tổng số sản phẩm",
            icon: ShoppingBag,
            value: loading ? "..." : data.products,
            description: "Sản phẩm trên hệ thống"
        }
    ];

    const listPanels = [
        {
            title: "Cửa hàng chờ duyệt",
            icon: AlertCircle,
            items: data.storesToVerify,
            renderItem: (item: Store) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors group"
                    onClick={() => navigate({ to: '/admin/stores/$storeId', params: { storeId: item.id } })}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium leading-none">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            )
        },
        {
            title: "Sản phẩm chờ duyệt",
            icon: PackageCheck,
            items: data.productsToVerify,
            renderItem: (item: Product) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors group"
                    onClick={() => navigate({ to: '/admin/products', search: { id: item.id } })}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium leading-none">{item.name}</span>
                        <span className="text-xs text-muted-foreground text-orange-500 font-medium">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: item.currency || 'VND' }).format(Number(item.price))}
                        </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            )
        },
        {
            title: "Giao dịch chờ duyệt",
            icon: CreditCard,
            items: data.transactionsToVerify,
            renderItem: (item: FinanceTransaction) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors group"
                    onClick={() => navigate({ to: '/admin/finance', search: { id: item.id } })}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-mono leading-none">{item.txCode}</span>
                        <span className="text-xs text-muted-foreground font-bold">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: item.currency || 'VND' }).format(Number(item.amount))}
                        </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            )
        },
        {
            title: "Đơn hàng mới",
            icon: ClipboardList,
            items: data.newOrders,
            renderItem: (item: Order) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors group"
                    onClick={() => navigate({ to: '/admin/orders', search: { id: item.id } })}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium leading-none">{item.orderCode}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{item.customerFullName}</span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5">
                                {new Intl.NumberFormat('vi-VN').format(Number(item.totalAmount))}đ
                            </Badge>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="w-full flex items-center justify-between">
                <h2 className="text-base md:text-lg font-bold tracking-tight ml-1.5">Tổng quan</h2>
            </div>

            {/* Cards Row */}
            <div className="grid auto-rows-min gap-2 mobile:grid-cols-2 lg:grid-cols-4">
                {cardStatictisData.map((item) => (
                    <CardStatistic key={item.title} className="bg-sidebar rounded-lg" items={item} />
                ))}
            </div>

            {/* Lists Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {listPanels.map((panel) => (
                    <Card key={panel.title} className="bg-sidebar border-none flex flex-col h-[400px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <panel.icon className="h-4 w-4 text-primary" />
                                {panel.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-2 pt-3 custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic">
                                    Đang tải...
                                </div>
                            ) : panel.items.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {(panel.items as any[]).map((item) => panel.renderItem(item as any))}
                                </div>
                            ) : (
                                <div className="flex flex-center justify-center h-full items-center text-xs text-muted-foreground italic">
                                    Không có dữ liệu
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
