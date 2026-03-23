"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  User,
  Gift,
  CreditCard,
  MessageSquare,
  FileText,
  XCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type {
  GiftOrder,
  GiftOrderStatus,
  GiftOrderTimelineEvent,
  GiftComboTier,
  GiftProfile,
  GiftRecipient,
} from "@/types";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
} from "@/types";
import { formatPrice, formatDate, formatDateTime } from "@/lib/formatters";

// ────────────────────────────────────────────
// Status flow
// ────────────────────────────────────────────
const STATUS_FLOW: GiftOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "delivering",
  "delivered",
];

const NEXT_STATUS_LABEL: Record<string, string> = {
  pending: "Xác nhận",
  confirmed: "Bắt đầu chuẩn bị",
  preparing: "Giao hàng",
  delivering: "Đã giao",
};

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
type OrderWithJoins = GiftOrder & {
  gift_profiles: Pick<GiftProfile, "full_name" | "phone" | "email"> | null;
  gift_combo_tiers: Pick<GiftComboTier, "name" | "price"> | null;
  gift_recipients: Pick<
    GiftRecipient,
    "full_name" | "phone" | "address"
  > | null;
  gift_order_timeline_events: GiftOrderTimelineEvent[];
};

interface Props {
  order: OrderWithJoins;
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────
export function OrderDetailClient({ order: initialOrder }: Props) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [internalNote, setInternalNote] = useState(
    order.internal_note || ""
  );
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[order.payment_status];
  const paymentMethodCfg = PAYMENT_METHOD_CONFIG[order.payment_method];

  // Get next status in flow
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus =
    currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIdx + 1]
      : null;

  // ────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────
  const advanceStatus = useCallback(
    async (targetStatus: GiftOrderStatus, note?: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${order.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus, note }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Lỗi cập nhật trạng thái");
          return;
        }
        const data = await res.json();
        setOrder(data.order);
        if (targetStatus === "cancelled") {
          setShowCancelModal(false);
          setCancelReason("");
        }
      } catch {
        alert("Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    },
    [order.id]
  );

  const saveInternalNote = useCallback(
    async (note: string) => {
      try {
        await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ internal_note: note }),
        });
      } catch {
        // silent fail
      }
    },
    [order.id]
  );

  const handleNoteChange = (value: string) => {
    setInternalNote(value);
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(() => {
      saveInternalNote(value);
    }, 1000);
  };

  const handleNoteBlur = () => {
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    saveInternalNote(internalNote);
  };

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/admin/b2bgifting/orders"
          className="inline-flex items-center gap-1 text-sm text-admin-text-secondary hover:text-admin-text transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display text-gold">
              Đơn hàng {order.code}
            </h1>
            <p className="mt-1 text-admin-text-secondary">
              Tạo ngày {formatDateTime(order.created_at)}
            </p>
          </div>
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-medium"
            style={{
              color: statusCfg.color,
              backgroundColor: statusCfg.bgColor,
            }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ──── Left column: Order info ──── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order details card */}
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider">
              Thông tin đơn hàng
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Code */}
              <InfoRow icon={<FileText size={15} />} label="Mã đơn">
                <span className="font-mono text-gold">{order.code}</span>
              </InfoRow>

              {/* Customer */}
              <InfoRow icon={<User size={15} />} label="Khách hàng">
                <span>{order.gift_profiles?.full_name || "\u2014"}</span>
                {order.gift_profiles?.phone && (
                  <span className="text-admin-text-secondary text-xs ml-2">
                    {order.gift_profiles.phone}
                  </span>
                )}
              </InfoRow>

              {/* Recipient */}
              <InfoRow icon={<User size={15} />} label="Người nhận">
                <span>{order.recipient_name}</span>
                {order.recipient_phone && (
                  <span className="text-admin-text-secondary text-xs ml-2">
                    {order.recipient_phone}
                  </span>
                )}
              </InfoRow>

              {/* Delivery address */}
              <InfoRow icon={<MapPin size={15} />} label="Địa chỉ giao">
                <span>
                  {order.delivery_address || "\u2014"}
                  {order.delivery_district &&
                    `, ${order.delivery_district}`}
                  {order.delivery_city && `, ${order.delivery_city}`}
                </span>
              </InfoRow>

              {/* Delivery date */}
              <InfoRow icon={<Clock size={15} />} label="Ngày giao">
                <span>
                  {order.delivery_date
                    ? formatDate(order.delivery_date)
                    : "\u2014"}
                  {order.delivery_time && ` lúc ${order.delivery_time}`}
                </span>
              </InfoRow>

              {/* Combo */}
              <InfoRow icon={<Gift size={15} />} label="Combo">
                <span>
                  {order.gift_combo_tiers?.name || "\u2014"}
                  {order.gift_combo_tiers?.price != null && (
                    <span className="text-admin-text-secondary text-xs ml-2">
                      ({formatPrice(order.gift_combo_tiers.price)})
                    </span>
                  )}
                </span>
              </InfoRow>

              {/* Payment */}
              <InfoRow icon={<CreditCard size={15} />} label="Thanh toán">
                <span className="flex items-center gap-2">
                  <span>{paymentMethodCfg.label}</span>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      color: paymentCfg.color,
                      backgroundColor: paymentCfg.bgColor,
                    }}
                  >
                    {paymentCfg.label}
                  </span>
                </span>
              </InfoRow>

              {/* Total */}
              <InfoRow icon={<CreditCard size={15} />} label="Tổng tiền">
                <span className="text-gold font-semibold">
                  {formatPrice(order.total)}
                </span>
                {order.discount > 0 && (
                  <span className="text-admin-text-secondary text-xs ml-2">
                    (giảm {formatPrice(order.discount)})
                  </span>
                )}
              </InfoRow>
            </div>
          </div>

          {/* Card message */}
          {order.card_message && (
            <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider mb-3">
                Lời nhắn trên thiệp
              </h2>
              <div className="bg-admin-bg border border-admin-border rounded-lg p-4 text-admin-text italic whitespace-pre-wrap">
                {order.card_message}
              </div>
            </div>
          )}

          {/* Customer note */}
          {order.note && (
            <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider mb-3">
                Ghi chú từ khách hàng
              </h2>
              <p className="text-admin-text-secondary whitespace-pre-wrap">
                {order.note}
              </p>
            </div>
          )}

          {/* Delivery note */}
          {order.delivery_note && (
            <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider mb-3">
                Ghi chú giao hàng
              </h2>
              <p className="text-admin-text-secondary whitespace-pre-wrap">
                {order.delivery_note}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider mb-4">
              Lịch sử trạng thái
            </h2>

            {order.gift_order_timeline_events &&
            order.gift_order_timeline_events.length > 0 ? (
              <div className="relative pl-6 space-y-4">
                {/* Vertical line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-admin-border" />

                {order.gift_order_timeline_events.map((event) => {
                  const evtCfg = ORDER_STATUS_CONFIG[event.status];
                  return (
                    <div key={event.id} className="relative">
                      {/* Dot */}
                      <div
                        className="absolute -left-6 top-1.5 w-[10px] h-[10px] rounded-full border-2"
                        style={{
                          borderColor: evtCfg.color,
                          backgroundColor: evtCfg.bgColor,
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium"
                            style={{ color: evtCfg.color }}
                          >
                            {evtCfg.label}
                          </span>
                          <span className="text-xs text-admin-text-secondary">
                            {formatDateTime(event.created_at)}
                          </span>
                        </div>
                        {event.note && (
                          <p className="mt-0.5 text-sm text-admin-text-secondary">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-admin-text-secondary">
                Chưa có lịch sử trạng thái
              </p>
            )}
          </div>
        </div>

        {/* ──── Right column: Status & Actions ──── */}
        <div className="space-y-6">
          {/* Status panel */}
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider">
              Trạng thái
            </h2>

            {/* Current status */}
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusCfg.color }}
              />
              <span className="text-admin-text font-medium">
                {statusCfg.label}
              </span>
            </div>

            {/* Status flow visualization */}
            <div className="flex items-center gap-1 flex-wrap">
              {STATUS_FLOW.map((s, i) => {
                const cfg = ORDER_STATUS_CONFIG[s];
                const isCurrent = s === order.status;
                const isPast =
                  STATUS_FLOW.indexOf(order.status) > i;
                return (
                  <div key={s} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight
                        size={12}
                        className="text-admin-text-secondary"
                      />
                    )}
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        isCurrent
                          ? ""
                          : isPast
                          ? "opacity-40"
                          : "opacity-30"
                      }`}
                      style={
                        isCurrent || isPast
                          ? {
                              color: cfg.color,
                              backgroundColor: cfg.bgColor,
                            }
                          : {
                              color: "#9A9490",
                              backgroundColor: "#1E1E1E",
                            }
                      }
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Advance button */}
            {nextStatus && order.status !== "cancelled" && (
              <button
                onClick={() => advanceStatus(nextStatus)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold text-white font-medium text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {NEXT_STATUS_LABEL[order.status] || "Tiếp theo"}
              </button>
            )}

            {/* Cancel button */}
            {order.status !== "cancelled" &&
              order.status !== "delivered" && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={16} />
                  Hủy đơn hàng
                </button>
              )}
          </div>

          {/* Internal note */}
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} />
              Ghi chú nội bộ
            </h2>
            <textarea
              value={internalNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Ghi chú cho nhân viên..."
              rows={4}
              className="w-full bg-admin-bg border border-admin-border rounded-lg p-3 text-sm text-admin-text placeholder:text-admin-text-secondary resize-none focus:outline-none focus:border-gold/50 transition-colors"
            />
            <p className="text-[11px] text-admin-text-secondary">
              Tự động lưu khi rời khỏi ô
            </p>
          </div>

          {/* Quick info */}
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-admin-text uppercase tracking-wider">
              Thông tin nhanh
            </h2>
            <div className="space-y-2 text-sm">
              {order.confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-admin-text-secondary">
                    Xác nhận lúc
                  </span>
                  <span className="text-admin-text">
                    {formatDateTime(order.confirmed_at)}
                  </span>
                </div>
              )}
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-admin-text-secondary">
                    Thanh toán lúc
                  </span>
                  <span className="text-admin-text">
                    {formatDateTime(order.paid_at)}
                  </span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-admin-text-secondary">
                    Giao hàng lúc
                  </span>
                  <span className="text-admin-text">
                    {formatDateTime(order.delivered_at)}
                  </span>
                </div>
              )}
              {order.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-admin-text-secondary">Hủy lúc</span>
                  <span className="text-red-400">
                    {formatDateTime(order.cancelled_at)}
                  </span>
                </div>
              )}
              {order.cancel_reason && (
                <div>
                  <span className="text-admin-text-secondary text-xs">
                    Lý do hủy:
                  </span>
                  <p className="text-red-400 text-xs mt-0.5">
                    {order.cancel_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-admin-surface border border-admin-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-admin-text">
              Hủy đơn hàng
            </h3>
            <p className="text-sm text-admin-text-secondary">
              Bạn có chắc muốn hủy đơn hàng{" "}
              <span className="text-gold font-mono">{order.code}</span>?
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Lý do hủy đơn (bắt buộc)..."
              rows={3}
              className="w-full bg-admin-bg border border-admin-border rounded-lg p-3 text-sm text-admin-text placeholder:text-admin-text-secondary resize-none focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-sm text-admin-text-secondary hover:text-admin-text transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  if (!cancelReason.trim()) {
                    alert("Vui lòng nhập lý do hủy đơn");
                    return;
                  }
                  advanceStatus("cancelled", cancelReason.trim());
                }}
                disabled={loading || !cancelReason.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Helper component
// ────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-admin-text-secondary mt-0.5 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-admin-text-secondary uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-sm text-admin-text">{children}</div>
      </div>
    </div>
  );
}
