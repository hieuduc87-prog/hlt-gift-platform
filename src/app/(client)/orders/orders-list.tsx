"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Package, Gift, CalendarDays, Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GiftOrder, GiftOrderStatus } from "@/types";
import { ORDER_STATUS_CONFIG } from "@/types";
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
    statuses: ["confirmed", "preparing", "delivering"],
  },
  { key: "delivered", label: "Đã giao", statuses: ["delivered"] },
  { key: "cancelled", label: "Đã hủy", statuses: ["cancelled"] },
];

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────
interface Props {
  initialOrders: GiftOrder[];
}

export function OrdersList({ initialOrders }: Props) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab || !tab.statuses) return initialOrders;
    return initialOrders.filter((o) =>
      tab.statuses!.includes(o.status)
    );
  }, [initialOrders, activeTab]);

  // Count per tab
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tab of TABS) {
      if (!tab.statuses) {
        map[tab.key] = initialOrders.length;
      } else {
        map[tab.key] = initialOrders.filter((o) =>
          tab.statuses!.includes(o.status)
        ).length;
      }
    }
    return map;
  }, [initialOrders]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display text-foreground">Đơn hàng</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {initialOrders.length} đơn hàng
          </p>
        </div>
        <Link href="/orders/new">
          <Button size="sm">
            <Plus size={16} />
            Đặt quà mới
          </Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-gold text-white"
                : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-surface-hover text-text-muted"
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={
            activeTab !== "all"
              ? "Không có đơn hàng nào"
              : "Chưa có đơn hàng"
          }
          description={
            activeTab !== "all"
              ? "Không có đơn hàng nào trong trạng thái này"
              : "Bắt đầu đặt quà cho người thân yêu"
          }
          action={
            activeTab === "all" && (
              <Link href="/orders/new">
                <Button size="sm">
                  <Gift size={16} />
                  Đặt quà mới
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Order card
// ────────────────────────────────────────────
function OrderCard({ order }: { order: GiftOrder }) {
  const statusCfg = ORDER_STATUS_CONFIG[order.status];

  return (
    <Link href="#">
      <Card variant="hover" className="cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground truncate">
                {order.recipient_name}
              </h3>
              <Badge
                size="sm"
                color={statusCfg.color}
                bgColor={statusCfg.bgColor}
              >
                {statusCfg.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Hash size={13} className="text-text-muted" />
                {order.code}
              </span>
              {order.delivery_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} className="text-text-muted" />
                  {formatDate(order.delivery_date)}
                </span>
              )}
            </div>
          </div>

          {/* Right: Total */}
          <div className="shrink-0 text-right">
            <p className="font-display font-bold text-gold">
              {formatPrice(order.total)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
