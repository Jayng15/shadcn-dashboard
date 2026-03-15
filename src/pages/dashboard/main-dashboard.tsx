
import { User, Store, ShoppingBag, Activity, AlertCircle, PackageCheck, CreditCard, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

import CardStatistic from "./components/card-statistic";

export default function MainDashoard() {
  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    products: 0,
    activeStores: 0,
    storesToVerify: 0,
    productsToVerify: 0,
    transactionsToVerify: 0,
    newOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
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
          api.get('/product', { params: { limit: 1 } }),
          api.get('/store', { params: { limit: 1, status: 'REQUESTED' } }),
          api.get('/product', { params: { limit: 1, isVerified: false } }),
          api.get('/finance/admin/transactions', { params: { limit: 1, verifiedStatus: 'PENDING' } }),
          api.get('/order/admin', { params: { limit: 1, status: 'PENDING' } })
        ]);

        setStats({
          users: usersResponse.data.pagination.total,
          stores: storesResponse.data.pagination.total,
          products: productsResponse.data.pagination.total,
          activeStores: activeStoresResponse.data.pagination.total,
          storesToVerify: storesToVerifyResponse.data.pagination.total,
          productsToVerify: productsToVerifyResponse.data.pagination.total,
          transactionsToVerify: transactionsToVerifyResponse.data.pagination.total,
          newOrders: newOrdersResponse.data.pagination.total
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cardStatictisData = [
    {
      title: "Tổng số người dùng",
      icon: User,
      value: loading ? "..." : stats.users,
      description: "Người dùng đã đăng ký"
    },
    {
      title: "Tổng số cửa hàng",
      icon: Store,
      value: loading ? "..." : stats.stores,
      description: "Tất cả cửa hàng (Đang hoạt động & Chờ duyệt)"
    },
    {
      title: "Cửa hàng đang hoạt động",
      icon: Activity,
      value: loading ? "..." : stats.activeStores,
      description: "Cửa hàng hiện đang hoạt động"
    },
    {
      title: "Tổng số sản phẩm",
      icon: ShoppingBag,
      value: loading ? "..." : stats.products,
      description: "Sản phẩm trên tất cả các cửa hàng"
    },
    {
      title: "Cửa hàng chờ duyệt",
      icon: AlertCircle,
      value: loading ? "..." : stats.storesToVerify,
      description: "Cửa hàng cần xác minh"
    },
    {
      title: "Sản phẩm chờ duyệt",
      icon: PackageCheck,
      value: loading ? "..." : stats.productsToVerify,
      description: "Sản phẩm cần xác minh"
    },
    {
      title: "Giao dịch chờ duyệt",
      icon: CreditCard,
      value: loading ? "..." : stats.transactionsToVerify,
      description: "Giao dịch tài chính chờ xử lý"
    },
    {
      title: "Đơn hàng mới",
      icon: ClipboardList,
      value: loading ? "..." : stats.newOrders,
      description: "Đơn hàng đang chờ xử lý"
    }
  ]

  return (
    <>
      <div className="w-full flex items-center justify-between">
        <h2 className="text-base md:text-lg font-bold tracking-tight ml-1.5">Tổng quan</h2>
      </div>
      <div className="grid auto-rows-min gap-2 mobile:grid-cols-2 lg:grid-cols-4">
        {cardStatictisData.map((item) => (
          <CardStatistic key={item.title} className="bg-sidebar rounded-lg" items={item} />
        ))}
      </div>
    </>
  )
}
