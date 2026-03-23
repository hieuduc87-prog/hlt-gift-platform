import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/formatters";
import { ORDER_STATUS_CONFIG } from "@/types";
import type { GiftOrder } from "@/types";
import Link from "next/link";
import { ArrowLeft, Clock, Package, MapPin } from "lucide-react";

// ────────────────────────────────────────────
// Time slot definitions
// ────────────────────────────────────────────
interface TimeSlot {
  key: string;
  label: string;
  range: string;
  match: (time: string | null) => boolean;
}

const TIME_SLOTS: TimeSlot[] = [
  {
    key: "morning",
    label: "Sáng",
    range: "9:00 - 12:00",
    match: (t) => {
      if (!t) return false;
      const lower = t.toLowerCase();
      return (
        lower.includes("sáng") ||
        lower.includes("sang") ||
        lower.includes("morning") ||
        lower.includes("9") ||
        lower.includes("10") ||
        lower.includes("11") ||
        lower === "9-12" ||
        lower === "09:00" ||
        lower === "10:00" ||
        lower === "11:00"
      );
    },
  },
  {
    key: "afternoon",
    label: "Chiều",
    range: "13:00 - 17:00",
    match: (t) => {
      if (!t) return false;
      const lower = t.toLowerCase();
      return (
        lower.includes("chiều") ||
        lower.includes("chieu") ||
        lower.includes("afternoon") ||
        lower.includes("13") ||
        lower.includes("14") ||
        lower.includes("15") ||
        lower.includes("16") ||
        lower === "13-17"
      );
    },
  },
  {
    key: "evening",
    label: "Tối",
    range: "17:00 - 20:00",
    match: (t) => {
      if (!t) return false;
      const lower = t.toLowerCase();
      return (
        lower.includes("tối") ||
        lower.includes("toi") ||
        lower.includes("evening") ||
        lower.includes("17") ||
        lower.includes("18") ||
        lower.includes("19") ||
        lower === "17-20"
      );
    },
  },
];

type OrderWithJoins = GiftOrder & {
  gift_profiles: { full_name: string } | null;
  gift_combo_tiers: { name: string } | null;
};

export default async function TodayDeliveryBoard() {
  const supabase = createServiceClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: orders } = await supabase
    .from("gift_orders")
    .select("*, gift_profiles(full_name), gift_combo_tiers(name)")
    .eq("delivery_date", today)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  const allOrders = (orders || []) as OrderWithJoins[];

  // Group orders by time slot
  const grouped: Record<string, OrderWithJoins[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    unassigned: [],
  };

  for (const order of allOrders) {
    let matched = false;
    for (const slot of TIME_SLOTS) {
      if (slot.match(order.delivery_time)) {
        grouped[slot.key].push(order);
        matched = true;
        break;
      }
    }
    if (!matched) {
      grouped.unassigned.push(order);
    }
  }

  const slotColors: Record<string, { bg: string; border: string; text: string }> = {
    morning: { bg: "bg-amber-900/20", border: "border-amber-700/30", text: "text-amber-400" },
    afternoon: { bg: "bg-blue-900/20", border: "border-blue-700/30", text: "text-blue-400" },
    evening: { bg: "bg-purple-900/20", border: "border-purple-700/30", text: "text-purple-400" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/b2bgifting/delivery"
          className="p-2 rounded-lg bg-admin-surface border border-admin-border hover:bg-admin-surface-hover transition-colors"
        >
          <ArrowLeft size={18} className="text-admin-text-secondary" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-display text-gold">
            Bảng giao hàng hôm nay
          </h1>
          <p className="mt-1 text-admin-text-secondary">
            {today} — {allOrders.length} đơn cần giao
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TIME_SLOTS.map((slot) => (
          <div
            key={slot.key}
            className="bg-admin-surface border border-admin-border rounded-xl p-4"
          >
            <p className="text-xs text-admin-text-secondary uppercase tracking-wider mb-1">
              {slot.label} ({slot.range})
            </p>
            <p className="text-2xl font-semibold text-admin-text">
              {grouped[slot.key].length}
            </p>
          </div>
        ))}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-4">
          <p className="text-xs text-admin-text-secondary uppercase tracking-wider mb-1">
            Chưa xếp giờ
          </p>
          <p className="text-2xl font-semibold text-admin-text">
            {grouped.unassigned.length}
          </p>
        </div>
      </div>

      {/* Time slot boards */}
      {TIME_SLOTS.map((slot) => {
        const slotOrders = grouped[slot.key];
        const colors = slotColors[slot.key];
        return (
          <div key={slot.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className={colors.text} />
              <h2 className={`text-lg font-display ${colors.text}`}>
                {slot.label} ({slot.range})
              </h2>
              <span className="text-sm text-admin-text-secondary">
                — {slotOrders.length} đơn
              </span>
            </div>

            {slotOrders.length === 0 ? (
              <div className="bg-admin-surface border border-admin-border rounded-xl p-6 text-center text-admin-text-secondary text-sm">
                Không có đơn nào trong khung giờ này
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slotOrders.map((order) => {
                  const statusCfg = ORDER_STATUS_CONFIG[order.status];
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/b2bgifting/orders/${order.id}`}
                      className={`${colors.bg} border ${colors.border} rounded-xl p-4 hover:brightness-110 transition-all block`}
                    >
                      {/* Top: code + status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs text-gold">
                          {order.code}
                        </span>
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bgColor,
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Recipient */}
                      <div className="flex items-start gap-2 mb-2">
                        <Package size={14} className="text-admin-text-secondary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-admin-text font-medium">
                            {order.recipient_name}
                          </p>
                          {order.recipient_phone && (
                            <p className="text-xs text-admin-text-secondary">
                              {order.recipient_phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Address */}
                      {order.delivery_address && (
                        <div className="flex items-start gap-2 mb-2">
                          <MapPin size={14} className="text-admin-text-secondary mt-0.5 shrink-0" />
                          <p className="text-xs text-admin-text-secondary line-clamp-2">
                            {order.delivery_address}
                            {order.delivery_district
                              ? `, ${order.delivery_district}`
                              : ""}
                          </p>
                        </div>
                      )}

                      {/* Bottom: combo + total */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-admin-border/30">
                        <span className="text-xs text-admin-text-secondary">
                          {order.gift_combo_tiers?.name || "\u2014"}
                        </span>
                        <span className="text-sm text-gold font-medium">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned */}
      {grouped.unassigned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-admin-text-secondary" />
            <h2 className="text-lg font-display text-admin-text-secondary">
              Chưa xếp giờ
            </h2>
            <span className="text-sm text-admin-text-secondary">
              — {grouped.unassigned.length} đơn
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped.unassigned.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status];
              return (
                <Link
                  key={order.id}
                  href={`/admin/b2bgifting/orders/${order.id}`}
                  className="bg-admin-surface border border-admin-border rounded-xl p-4 hover:bg-admin-surface-hover transition-all block"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-gold">
                      {order.code}
                    </span>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        color: statusCfg.color,
                        backgroundColor: statusCfg.bgColor,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <Package size={14} className="text-admin-text-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-admin-text font-medium">
                        {order.recipient_name}
                      </p>
                      {order.recipient_phone && (
                        <p className="text-xs text-admin-text-secondary">
                          {order.recipient_phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {order.delivery_address && (
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin size={14} className="text-admin-text-secondary mt-0.5 shrink-0" />
                      <p className="text-xs text-admin-text-secondary line-clamp-2">
                        {order.delivery_address}
                        {order.delivery_district
                          ? `, ${order.delivery_district}`
                          : ""}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-admin-border/30">
                    <span className="text-xs text-admin-text-secondary">
                      {order.gift_combo_tiers?.name || "\u2014"}
                    </span>
                    <span className="text-sm text-gold font-medium">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allOrders.length === 0 && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-16 text-center">
          <Package
            size={40}
            className="mx-auto text-admin-text-secondary mb-4"
          />
          <p className="text-admin-text-secondary">
            Không có đơn giao hàng nào hôm nay
          </p>
        </div>
      )}
    </div>
  );
}
