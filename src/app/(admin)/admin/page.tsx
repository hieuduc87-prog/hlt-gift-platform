import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/formatters";
import { ORDER_STATUS_CONFIG } from "@/types";
import type { GiftOrder } from "@/types";
import { Users, Package, DollarSign, Wallet } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  // Current month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Fetch all stats in parallel
  const [
    clientsRes,
    monthOrdersRes,
    walletsRes,
    recentOrdersRes,
  ] = await Promise.all([
    supabase
      .from("gift_profiles")
      .select("id", { count: "exact", head: true })
      .neq("role", "admin"),
    supabase
      .from("gift_orders")
      .select("total")
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd),
    supabase.from("gift_wallets").select("balance"),
    supabase
      .from("gift_orders")
      .select("*, gift_profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalClients = clientsRes.count || 0;

  const monthOrders = monthOrdersRes.data || [];
  const monthOrderCount = monthOrders.length;
  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const totalWalletBalance = (walletsRes.data || []).reduce(
    (sum, w) => sum + Number(w.balance || 0),
    0
  );

  const recentOrders = (recentOrdersRes.data || []) as (GiftOrder & {
    gift_profiles: { full_name: string } | null;
  })[];

  const stats = [
    {
      icon: <Users size={22} />,
      label: "Tổng khách hàng",
      value: totalClients.toLocaleString("vi-VN"),
    },
    {
      icon: <Package size={22} />,
      label: "Đơn tháng này",
      value: monthOrderCount.toLocaleString("vi-VN"),
    },
    {
      icon: <DollarSign size={22} />,
      label: "Doanh thu tháng",
      value: formatPrice(monthRevenue),
    },
    {
      icon: <Wallet size={22} />,
      label: "Ví tổng",
      value: formatPrice(totalWalletBalance),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-gold">Dashboard</h1>
        <p className="mt-1 text-admin-text-secondary">
          Tổng quan hệ thống Gift Platform
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-admin-surface border border-admin-border rounded-xl p-5"
          >
            <div className="text-gold mb-3">{s.icon}</div>
            <p className="text-2xl font-semibold text-admin-text">{s.value}</p>
            <p className="text-sm text-admin-text-secondary mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-admin-surface border border-admin-border rounded-xl">
        <div className="px-5 py-4 border-b border-admin-border">
          <h2 className="text-lg font-display text-admin-text">
            Đơn hàng gần đây
          </h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-admin-text-secondary">
            Chưa có đơn hàng nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Mã</th>
                  <th className="px-5 py-3 font-medium">Khách hàng</th>
                  <th className="px-5 py-3 font-medium">Người nhận</th>
                  <th className="px-5 py-3 font-medium text-right">Tổng</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const statusCfg = ORDER_STATUS_CONFIG[order.status];
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-gold text-xs">
                        {order.code}
                      </td>
                      <td className="px-5 py-3 text-admin-text">
                        {order.gift_profiles?.full_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-admin-text">
                        {order.recipient_name}
                      </td>
                      <td className="px-5 py-3 text-admin-text text-right">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bgColor,
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
