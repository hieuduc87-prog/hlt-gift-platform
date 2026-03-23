import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice, formatDate, formatDateShort } from "@/lib/formatters";
import type { GiftTransaction, GiftWalletTxType } from "@/types";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  FileText,
} from "lucide-react";

const TX_TYPE_CONFIG: Record<
  GiftWalletTxType,
  { label: string; color: string; bgColor: string; direction: "in" | "out" }
> = {
  topup: { label: "Nạp tiền", color: "#3A7D54", bgColor: "#E8F5ED", direction: "in" },
  purchase: { label: "Mua hàng", color: "#E85C5C", bgColor: "#F8EDED", direction: "out" },
  refund: { label: "Hoàn tiền", color: "#2C5F8A", bgColor: "#E8F0F8", direction: "in" },
  bonus: { label: "Thưởng", color: "#C9A96E", bgColor: "#FDF8F0", direction: "in" },
  adjustment: { label: "Điều chỉnh", color: "#9A9490", bgColor: "#F5F3F0", direction: "out" },
};

export default async function AdminFinancePage() {
  const supabase = createServiceClient();

  // Last 30 days range
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch wallet aggregates, recent transactions, daily stats, top clients in parallel
  const [walletsRes, transactionsRes, dailyStatsRes, topClientsRes] =
    await Promise.all([
      supabase.from("gift_wallets").select("balance, total_topup, total_spent"),
      supabase
        .from("gift_transactions")
        .select("*, gift_wallets(gift_profiles(full_name))")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("gift_daily_stats")
        .select("stat_date, total_revenue, total_orders")
        .gte("stat_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("stat_date", { ascending: true }),
      supabase
        .from("gift_orders")
        .select("profile_id, total, gift_profiles(full_name)")
        .neq("status", "cancelled"),
    ]);

  const wallets = walletsRes.data || [];
  const totalTopup = wallets.reduce((s, w) => s + Number(w.total_topup || 0), 0);
  const totalSpent = wallets.reduce((s, w) => s + Number(w.total_spent || 0), 0);
  const systemBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);

  const transactions = (transactionsRes.data || []) as (GiftTransaction & {
    gift_wallets: { gift_profiles: { full_name: string } | null } | null;
  })[];

  // Build revenue chart data (last 30 days)
  const dailyStats = dailyStatsRes.data || [];
  const chartDays: { date: string; label: string; revenue: number; orders: number }[] =
    [];

  // Fill in all 30 days (some may be missing from DB)
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = dailyStats.find((s) => s.stat_date === dateStr);
    chartDays.push({
      date: dateStr,
      label: formatDateShort(d),
      revenue: found ? Number(found.total_revenue || 0) : 0,
      orders: found ? Number(found.total_orders || 0) : 0,
    });
  }

  const maxRevenue = Math.max(...chartDays.map((d) => d.revenue), 1);

  // Top 5 clients by spend
  const clientSpendMap = new Map<
    string,
    { name: string; totalOrders: number; totalSpent: number }
  >();
  for (const order of topClientsRes.data || []) {
    const pid = order.profile_id;
    const existing = clientSpendMap.get(pid);
    const profileJoin = (order as unknown as { gift_profiles: { full_name: string } | { full_name: string }[] | null }).gift_profiles;
    const name = Array.isArray(profileJoin)
      ? profileJoin[0]?.full_name || "Khách hàng"
      : profileJoin?.full_name || "Khách hàng";
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += Number(order.total || 0);
    } else {
      clientSpendMap.set(pid, {
        name,
        totalOrders: 1,
        totalSpent: Number(order.total || 0),
      });
    }
  }
  const topClients = Array.from(clientSpendMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const stats = [
    {
      icon: <TrendingUp size={22} />,
      label: "Tổng nạp",
      value: formatPrice(totalTopup),
      accent: "text-success",
    },
    {
      icon: <TrendingDown size={22} />,
      label: "Tổng chi",
      value: formatPrice(totalSpent),
      accent: "text-error",
    },
    {
      icon: <Wallet size={22} />,
      label: "Số dư hệ thống",
      value: formatPrice(systemBalance),
      accent: "text-gold",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gold">Tài chính</h1>
          <p className="mt-1 text-admin-text-secondary">
            Tổng quan tài chính hệ thống
          </p>
        </div>
        <Link
          href="/admin/finance/transactions"
          className="flex items-center gap-2 px-4 py-2.5 bg-admin-surface border border-admin-border rounded-lg text-sm text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text transition-colors"
        >
          <FileText size={16} />
          Lịch sử giao dịch
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-admin-surface border border-admin-border rounded-xl p-5"
          >
            <div className={`mb-3 ${s.accent}`}>{s.icon}</div>
            <p className={`text-2xl font-semibold ${s.accent}`}>{s.value}</p>
            <p className="text-sm text-admin-text-secondary mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart — last 30 days */}
      <div className="bg-admin-surface border border-admin-border rounded-xl">
        <div className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
          <BarChart3 size={18} className="text-gold" />
          <h2 className="text-lg font-display text-admin-text">
            Doanh thu 30 ngày gần nhất
          </h2>
        </div>
        <div className="p-5">
          {/* Chart container */}
          <div className="flex items-end gap-[3px] h-48">
            {chartDays.map((day) => {
              const heightPct =
                maxRevenue > 0
                  ? Math.max((day.revenue / maxRevenue) * 100, day.revenue > 0 ? 4 : 0)
                  : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                    <div className="bg-admin-bg border border-admin-border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                      <p className="text-admin-text font-medium">
                        {day.label}
                      </p>
                      <p className="text-gold">
                        {formatPrice(day.revenue)}
                      </p>
                      <p className="text-admin-text-secondary">
                        {day.orders} đơn
                      </p>
                    </div>
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-200 hover:opacity-80"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: day.revenue > 0 ? "#C9A96E" : "transparent",
                      minHeight: day.revenue > 0 ? "3px" : "0px",
                    }}
                  />
                </div>
              );
            })}
          </div>
          {/* X-axis labels (show every 5th day) */}
          <div className="flex gap-[3px] mt-2">
            {chartDays.map((day, i) => (
              <div
                key={day.date}
                className="flex-1 text-center text-[10px] text-admin-text-secondary"
              >
                {i % 5 === 0 ? day.label : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 clients by spend */}
      <div className="bg-admin-surface border border-admin-border rounded-xl">
        <div className="px-5 py-4 border-b border-admin-border">
          <h2 className="text-lg font-display text-admin-text">
            Top 5 khách hàng chi tiêu nhiều nhất
          </h2>
        </div>
        {topClients.length === 0 ? (
          <div className="p-8 text-center text-admin-text-secondary">
            Chưa có dữ liệu
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium w-10">#</th>
                  <th className="px-5 py-3 font-medium">Tên khách hàng</th>
                  <th className="px-5 py-3 font-medium text-right">
                    Số đơn
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    Tổng chi tiêu
                  </th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3 text-gold font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3 text-admin-text">
                      {client.name}
                    </td>
                    <td className="px-5 py-3 text-admin-text text-right">
                      {client.totalOrders}
                    </td>
                    <td className="px-5 py-3 text-gold font-medium text-right">
                      {formatPrice(client.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-admin-surface border border-admin-border rounded-xl">
        <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
          <h2 className="text-lg font-display text-admin-text">
            Giao dịch gần đây
          </h2>
          <Link
            href="/admin/finance/transactions"
            className="text-sm text-gold hover:underline"
          >
            Xem tất cả
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-admin-text-secondary">
            Chưa có giao dịch nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium w-8"></th>
                  <th className="px-5 py-3 font-medium">Loại</th>
                  <th className="px-5 py-3 font-medium">Khách hàng</th>
                  <th className="px-5 py-3 font-medium">Mô tả</th>
                  <th className="px-5 py-3 font-medium text-right">Số tiền</th>
                  <th className="px-5 py-3 font-medium text-right">
                    Số dư sau
                  </th>
                  <th className="px-5 py-3 font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const txCfg = TX_TYPE_CONFIG[tx.type];
                  const isIn = txCfg.direction === "in";

                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3">
                        {isIn ? (
                          <ArrowDownLeft size={16} className="text-success" />
                        ) : (
                          <ArrowUpRight size={16} className="text-error" />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            color: txCfg.color,
                            backgroundColor: txCfg.bgColor,
                          }}
                        >
                          {txCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-admin-text">
                        {tx.gift_wallets?.gift_profiles?.full_name || "\u2014"}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary max-w-[200px] truncate">
                        {tx.description || "\u2014"}
                      </td>
                      <td
                        className={`px-5 py-3 font-medium text-right ${
                          isIn ? "text-success" : "text-error"
                        }`}
                      >
                        {isIn ? "+" : "-"}
                        {formatPrice(Math.abs(tx.amount))}
                      </td>
                      <td className="px-5 py-3 text-admin-text text-right">
                        {formatPrice(tx.balance_after)}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary whitespace-nowrap">
                        {formatDate(tx.created_at)}
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
