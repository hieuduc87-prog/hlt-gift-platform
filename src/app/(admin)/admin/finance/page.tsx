import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { GiftTransaction, GiftWalletTxType } from "@/types";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";

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

  // Fetch wallet aggregates + recent transactions in parallel
  const [walletsRes, transactionsRes] = await Promise.all([
    supabase.from("gift_wallets").select("balance, total_topup, total_spent"),
    supabase
      .from("gift_transactions")
      .select("*, gift_wallets(gift_profiles(full_name))")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const wallets = walletsRes.data || [];
  const totalTopup = wallets.reduce((s, w) => s + Number(w.total_topup || 0), 0);
  const totalSpent = wallets.reduce((s, w) => s + Number(w.total_spent || 0), 0);
  const systemBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);

  const transactions = (transactionsRes.data || []) as (GiftTransaction & {
    gift_wallets: { gift_profiles: { full_name: string } | null } | null;
  })[];

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
      <div>
        <h1 className="text-2xl font-display text-gold">Tài chính</h1>
        <p className="mt-1 text-admin-text-secondary">
          Tổng quan tài chính hệ thống
        </p>
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

      {/* Recent transactions */}
      <div className="bg-admin-surface border border-admin-border rounded-xl">
        <div className="px-5 py-4 border-b border-admin-border">
          <h2 className="text-lg font-display text-admin-text">
            Giao dịch gần đây
          </h2>
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
                  <th className="px-5 py-3 font-medium text-right">Số dư sau</th>
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
                        {tx.gift_wallets?.gift_profiles?.full_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary max-w-[200px] truncate">
                        {tx.description || "—"}
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
