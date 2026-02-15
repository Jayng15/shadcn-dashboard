
import { User, Store, ShoppingBag, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

import CardStatistic from "./components/card-statistic";
// import OverviewChart from "./components/overview-chart";
// import LegendChart from "./components/legend-chart";
// import InteractiveChart from "./components/interactive-chart";

export default function MainDashoard() {
  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    products: 0,
    activeStores: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersResponse, storesResponse, activeStoresResponse, productsResponse] = await Promise.all([
          api.get('/user/list', { params: { limit: 1 } }),
          api.get('/store', { params: { limit: 1 } }),
          api.get('/store', { params: { limit: 1, status: 'ACTIVE' } }),
          api.get('/product', { params: { limit: 1 } })
        ]);

        setStats({
          users: usersResponse.data.pagination.total,
          stores: storesResponse.data.pagination.total,
          products: productsResponse.data.pagination.total,
          activeStores: activeStoresResponse.data.pagination.total
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
      {/*
      <div className="min-h-[100vh] flex-1 md:min-h-min grid md:grid-cols-2 lg:grid-cols-7 gap-2">
        <OverviewChart className="md:col-span-1 lg:col-span-4 bg-sidebar rounded-lg" />
        <LegendChart className="md:col-span-1 lg:col-span-3 bg-sidebar rounded-lg" />
      </div>
      <InteractiveChart />
      */}
    </>
  )
}
