"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import type { GiftOrder, GiftOrderStatus } from "@/types";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "@/types";
import { formatPrice, formatDate } from "@/lib/formatters";

// ────────────────────────────────────────────
// Tab definitions
// ────────────────────────────────────────────
interface StatusTab {
  key: string;
  label: string;
  statuses: GiftOrderStatus[] | null; // null = all
}

const TABS: StatusTab[] = [
  { key: "all", label: "Tất cả", statuses: null },
  { key: "pending", label: "Chờ xác nhận", statuses: ["draft", "pending"] },
  {
    key: "processing",
    label: "Đang xử lý",
    statuses: ["confirmed", "preparing"],
  },
  { key: "delivering", label: "Đang giao", statuses: ["delivering"] },
  { key: "delivered", label: "Đã giao", statuses: ["delivered"] },
  { key: "cancelled", label: "Đã hủy", statuses: ["cancelled"] },
];

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
type OrderWithJoins = GiftOrder & {
  gift_profiles: { full_name: string } | null;
  gift_combo_tiers: { name: string } | null;
  gift_recipients: { full_name: string } | null;
};

interface Props {
  orders: OrderWithJoins[];
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────
export function AdminOrdersClient({ orders }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = orders;

    // Filter by tab
    const tab = TABS.find((t) => t.key === activeTab);
    if (tab?.statuses) {
      result = result.filter((o) => tab.statuses!.includes(o.status));
    }

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.recipient_name.toLowerCase().includes(q) ||
          (o.gift_profiles?.full_name || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, activeTab, search]);

  // Count per tab
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tab of TABS) {
      if (!tab.statuses) {
        map[tab.key] = orders.length;
      } else {
        map[tab.key] = orders.filter((o) =>
          tab.statuses!.includes(o.status)
        ).length;
      }
    }
    return map;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gold">Đơn hàng</h1>
          <p className="mt-1 text-admin-text-secondary">
            Tất cả đơn hàng trong hệ thống ({orders.length})
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-secondary"
        />
        <input
          type="text"
          placeholder="Tìm theo mã đơn, tên người nhận, tên khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-admin-surface border border-admin-border rounded-lg text-sm text-admin-text placeholder:text-admin-text-secondary focus:outline-none focus:border-gold/50 transition-colors"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-gold text-white"
                : "text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-admin-surface-hover text-admin-text-secondary"
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package
              size={36}
              className="mx-auto text-admin-text-secondary mb-3"
            />
            <p className="text-admin-text-secondary">
              {search.trim()
                ? "Không tìm thấy đơn hàng nào"
                : "Chưa có đơn hàng nào"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Mã</th>
                  <th className="px-5 py-3 font-medium">Khách hàng</th>
                  <th className="px-5 py-3 font-medium">Người nhận</th>
                  <th className="px-5 py-3 font-medium">Combo</th>
                  <th className="px-5 py-3 font-medium">Ngày giao</th>
                  <th className="px-5 py-3 font-medium text-right">Tổng</th>
                  <th className="px-5 py-3 font-medium">Thanh toán</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const statusCfg = ORDER_STATUS_CONFIG[order.status];
                  const paymentCfg =
                    PAYMENT_STATUS_CONFIG[order.payment_status];
                  return (
                    <tr
                      key={order.id}
                      onClick={() =>
                        router.push(`/admin/orders/${order.id}`)
                      }
                      className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 font-mono text-gold text-xs">
                        {order.code}
                      </td>
                      <td className="px-5 py-3 text-admin-text">
                        {order.gift_profiles?.full_name || "\u2014"}
                      </td>
                      <td className="px-5 py-3 text-admin-text">
                        {order.recipient_name}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary">
                        {order.gift_combo_tiers?.name || "\u2014"}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary whitespace-nowrap">
                        {order.delivery_date
                          ? formatDate(order.delivery_date)
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-3 text-admin-text font-medium text-right">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            color: paymentCfg.color,
                            backgroundColor: paymentCfg.bgColor,
                          }}
                        >
                          {paymentCfg.label}
                        </span>
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
                      <td className="px-5 py-3 text-admin-text-secondary whitespace-nowrap">
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
