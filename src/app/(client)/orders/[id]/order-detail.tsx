"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CreditCard,
  XCircle,
  RotateCcw,
  Hash,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Package,
  StickyNote,
  CheckCircle2,
  Loader2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
} from "@/types";
import type { GiftPaymentMethod } from "@/types";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { OrderWithJoins } from "./page";

// ────────────────────────────────────────────
// Timeline status labels & icons mapping
// ────────────────────────────────────────────
const TIMELINE_LABELS: Record<string, string> = {
  draft: "Đơn hàng được tạo",
  pending: "Đã thanh toán, chờ xác nhận",
  confirmed: "Shop đã xác nhận đơn",
  preparing: "Đang chuẩn bị quà",
  delivering: "Đang giao hàng",
  delivered: "Đã giao thành công",
  cancelled: "Đơn hàng đã hủy",
};

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────
interface Props {
  order: OrderWithJoins;
}

export function OrderDetail({ order: initial }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const comboName = order.gift_combo_tiers?.name || "—";
  const comboPrice = order.gift_combo_tiers?.price ?? order.subtotal;
  const paymentCfg = PAYMENT_METHOD_CONFIG[order.payment_method as GiftPaymentMethod] || PAYMENT_METHOD_CONFIG.wallet;

  // Sort timeline events by created_at ascending
  const timelineEvents = [...(order.gift_order_timeline_events || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // ────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────
  async function handlePay() {
    setPaying(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Không thể thanh toán");
        return;
      }

      setOrder(data);
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setPaying(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Không thể hủy đơn");
        return;
      }

      setOrder((prev) => ({
        ...prev,
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason || null,
        payment_status: prev.payment_status === "paid" ? "refunded" : prev.payment_status,
      }));
      setShowCancelConfirm(false);
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setCancelling(false);
    }
  }

  async function handleReorder() {
    setReordering(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/reorder`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Không thể đặt lại");
        return;
      }

      router.push(`/orders/${data.id}`);
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setReordering(false);
    }
  }

  function formatDateTime(d: string) {
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/orders"
          className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display text-foreground">
              Đơn hàng
            </h1>
            <Badge
              size="md"
              color={statusCfg.color}
              bgColor={statusCfg.bgColor}
            >
              {statusCfg.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
            <Hash size={13} className="text-text-muted" />
            {order.code}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-gold text-xl">
            {formatPrice(order.total)}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {/* Recipient info */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Người nhận
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={15} className="text-text-muted shrink-0" />
              <span className="font-medium text-foreground">
                {order.recipient_name}
              </span>
            </div>
            {order.recipient_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={15} className="text-text-muted shrink-0" />
                <span>{order.recipient_phone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Order details */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Chi tiết đơn
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Package size={15} className="text-text-muted" />
                Combo
              </div>
              <span className="font-medium text-foreground">{comboName}</span>
            </div>

            {order.delivery_date && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <CalendarDays size={15} className="text-text-muted" />
                  Ngày giao
                </div>
                <span className="font-medium text-foreground">
                  {formatDate(order.delivery_date)}
                </span>
              </div>
            )}

            {order.delivery_time && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock size={15} className="text-text-muted" />
                  Khung giờ
                </div>
                <span className="font-medium text-foreground">
                  {order.delivery_time}
                </span>
              </div>
            )}

            {order.delivery_address && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-start gap-2 text-text-secondary">
                  <MapPin size={15} className="text-text-muted shrink-0 mt-0.5" />
                  Địa chỉ
                </div>
                <span className="font-medium text-foreground text-right max-w-[60%]">
                  {order.delivery_address}
                </span>
              </div>
            )}

            {order.delivery_note && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <StickyNote size={15} className="text-text-muted" />
                  Ghi chú giao
                </div>
                <span className="text-foreground text-right max-w-[60%]">
                  {order.delivery_note}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Card message */}
        {order.card_message && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Lời nhắn thiệp
            </h2>
            <div className="flex items-start gap-2">
              <MessageSquare size={15} className="text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-foreground italic leading-relaxed">
                &ldquo;{order.card_message}&rdquo;
              </p>
            </div>
          </Card>
        )}

        {/* Payment summary */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Thanh toán
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Tạm tính</span>
              <span>{formatPrice(comboPrice)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Phí giao hàng</span>
                <span>{formatPrice(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Giảm giá</span>
                <span className="text-success">-{formatPrice(order.discount)}</span>
              </div>
            )}
            {order.promotion_discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">
                  Mã giảm giá {order.promotion_code && `(${order.promotion_code})`}
                </span>
                <span className="text-success">-{formatPrice(order.promotion_discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border-subtle">
              <span className="font-semibold text-foreground">Tổng tiền</span>
              <span className="font-display font-bold text-gold text-lg">
                {formatPrice(order.total)}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-text-secondary">Phương thức</span>
              <span>{paymentCfg.icon} {paymentCfg.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Trạng thái</span>
              <Badge
                size="sm"
                variant={
                  order.payment_status === "paid"
                    ? "success"
                    : order.payment_status === "refunded"
                      ? "info"
                      : "warning"
                }
              >
                {order.payment_status === "paid"
                  ? "Đã thanh toán"
                  : order.payment_status === "refunded"
                    ? "Đã hoàn tiền"
                    : order.payment_status === "partial"
                      ? "Thanh toán một phần"
                      : "Chưa thanh toán"}
              </Badge>
            </div>
            {order.paid_at && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Thanh toán lúc</span>
                <span className="text-text-secondary">{formatDateTime(order.paid_at)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Delivery photos */}
        {order.delivery_photos && order.delivery_photos.length > 0 && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              <Camera size={15} className="inline mr-1" />
              Ảnh giao hàng
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {order.delivery_photos.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden border border-border"
                >
                  <Image
                    src={url}
                    alt={`Ảnh giao hàng ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Timeline */}
        {timelineEvents.length > 0 && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
              Lịch sử đơn hàng
            </h2>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {timelineEvents.map((event, i) => {
                  const isLast = i === timelineEvents.length - 1;
                  const evtStatusCfg = ORDER_STATUS_CONFIG[event.status];

                  return (
                    <div key={event.id} className="flex gap-3 relative">
                      {/* Dot */}
                      <div
                        className="w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center shrink-0 bg-surface z-10"
                        style={{
                          borderColor: evtStatusCfg.color,
                        }}
                      >
                        {isLast && (
                          <CheckCircle2
                            size={13}
                            style={{ color: evtStatusCfg.color }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-1">
                        <p
                          className="text-sm font-medium"
                          style={{ color: isLast ? evtStatusCfg.color : undefined }}
                        >
                          {TIMELINE_LABELS[event.status] || evtStatusCfg.label}
                        </p>
                        {event.note && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {event.note}
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatDateTime(event.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Cancel reason */}
        {order.status === "cancelled" && order.cancel_reason && (
          <Card padding="lg" className="border-error/30">
            <h2 className="text-sm font-semibold text-error mb-2">
              Lý do hủy
            </h2>
            <p className="text-sm text-foreground">{order.cancel_reason}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-4">
          {order.status === "draft" && (
            <>
              <Button
                className="flex-1"
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                {paying ? "Đang xử lý..." : "Thanh toán & Xác nhận"}
              </Button>
              <Button
                variant="ghost"
                className="text-error hover:bg-error-bg"
                onClick={() => setShowCancelConfirm(true)}
              >
                <XCircle size={16} />
                Hủy
              </Button>
            </>
          )}

          {order.status === "pending" && (
            <Button
              variant="ghost"
              className="text-error hover:bg-error-bg"
              onClick={() => setShowCancelConfirm(true)}
            >
              <XCircle size={16} />
              Hủy đơn hàng
            </Button>
          )}

          {order.status === "delivered" && (
            <Button
              variant="secondary"
              onClick={handleReorder}
              disabled={reordering}
            >
              {reordering ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              {reordering ? "Đang tạo..." : "Đặt lại"}
            </Button>
          )}
        </div>
      </div>

      {/* Cancel confirmation overlay */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Xác nhận hủy đơn
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {order.payment_status === "paid"
                ? "Đơn hàng đã thanh toán. Số tiền sẽ được hoàn lại vào ví của bạn."
                : "Bạn có chắc chắn muốn hủy đơn hàng này?"}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Lý do hủy (tùy chọn)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                rows={2}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelReason("");
                }}
              >
                Quay lại
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
