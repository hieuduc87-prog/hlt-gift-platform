"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Package,
  Repeat,
  Pause,
  Play,
  SkipForward,
  XCircle,
  Loader2,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  SUBSCRIPTION_STATUS_CONFIG,
  FREQUENCY_CONFIG,
} from "@/types";
import type {
  GiftSubscriptionStatus,
  GiftSubscriptionFrequency,
} from "@/types";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { SubscriptionDetailData } from "./page";

// ────────────────────────────────────────────
// Delivery status config
// ────────────────────────────────────────────
const DELIVERY_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  scheduled: {
    label: "Đã lên lịch",
    color: "#2C5F8A",
    bgColor: "#E8F0F8",
  },
  processing: {
    label: "Đang xử lý",
    color: "#E8A44E",
    bgColor: "#FEF8E8",
  },
  delivered: {
    label: "Đã giao",
    color: "#3A7D54",
    bgColor: "#E8F5ED",
  },
  skipped: {
    label: "Đã bỏ qua",
    color: "#9A9490",
    bgColor: "#F5F3F0",
  },
  failed: {
    label: "Thất bại",
    color: "#9E3A3A",
    bgColor: "#F8EDED",
  },
};

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────
interface Props {
  subscription: SubscriptionDetailData;
}

export function SubscriptionDetail({ subscription: initial }: Props) {
  const router = useRouter();
  const [sub, setSub] = useState(initial);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const statusCfg =
    SUBSCRIPTION_STATUS_CONFIG[sub.status as GiftSubscriptionStatus];
  const freqCfg =
    FREQUENCY_CONFIG[sub.frequency as GiftSubscriptionFrequency];
  const comboName = sub.gift_combo_tiers?.name || "—";
  const comboPrice = sub.gift_combo_tiers?.price ?? 0;
  const discountedPrice = sub.discount_percent
    ? Math.round(comboPrice * (1 - sub.discount_percent / 100))
    : comboPrice;

  // Sort deliveries by scheduled_date descending
  const deliveries = [
    ...(sub.gift_subscription_deliveries || []),
  ].sort(
    (a, b) =>
      new Date(b.scheduled_date).getTime() -
      new Date(a.scheduled_date).getTime()
  );

  // ────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────
  async function handleAction(
    action: "pause" | "resume" | "cancel",
    body?: Record<string, unknown>
  ) {
    setActionLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/subscriptions/${sub.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Không thể thực hiện thao tác");
        return;
      }

      // Update local state
      if (action === "pause") {
        setSub((prev) => ({
          ...prev,
          status: "paused" as GiftSubscriptionStatus,
          paused_at: new Date().toISOString(),
        }));
      } else if (action === "resume") {
        setSub((prev) => ({
          ...prev,
          status: "active" as GiftSubscriptionStatus,
          paused_at: null,
          next_delivery_date: data.next_delivery_date || prev.next_delivery_date,
        }));
      } else if (action === "cancel") {
        setSub((prev) => ({
          ...prev,
          status: "cancelled" as GiftSubscriptionStatus,
          cancelled_at: new Date().toISOString(),
        }));
      }

      setShowCancelConfirm(false);
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSkip() {
    setActionLoading("skip");
    setError(null);

    try {
      const res = await fetch(`/api/subscriptions/${sub.id}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: skipReason || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Không thể bỏ qua lần giao này");
        return;
      }

      setSub((prev) => ({
        ...prev,
        next_delivery_date: data.next_delivery_date,
        skipped_count: prev.skipped_count + 1,
      }));
      setShowSkipConfirm(false);
      setSkipReason("");
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/subscriptions"
          className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display text-foreground">
              Đăng ký định kỳ
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
            <CalendarClock size={13} className="text-text-muted" />
            {freqCfg?.label || sub.frequency}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-gold text-xl">
            {formatPrice(discountedPrice)}
          </p>
          <p className="text-xs text-text-muted">
            /{freqCfg?.label || sub.frequency}
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
                {sub.gift_recipients?.full_name || "—"}
              </span>
            </div>
            {sub.gift_recipients?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={15} className="text-text-muted shrink-0" />
                <span>{sub.gift_recipients.phone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Subscription details */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Chi tiết đăng ký
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Package size={15} className="text-text-muted" />
                Combo
              </div>
              <span className="font-medium text-foreground">{comboName}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Repeat size={15} className="text-text-muted" />
                Tần suất
              </div>
              <span className="font-medium text-foreground">
                {freqCfg?.label || sub.frequency}
              </span>
            </div>

            {sub.status === "active" && sub.next_delivery_date && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <CalendarDays size={15} className="text-text-muted" />
                  Lần giao tiếp theo
                </div>
                <span className="font-medium text-foreground">
                  {formatDate(sub.next_delivery_date)}
                </span>
              </div>
            )}

            {sub.delivery_time && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock size={15} className="text-text-muted" />
                  Khung giờ
                </div>
                <span className="font-medium text-foreground">
                  {sub.delivery_time}
                </span>
              </div>
            )}

            {sub.delivery_address && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-start gap-2 text-text-secondary">
                  <MapPin
                    size={15}
                    className="text-text-muted shrink-0 mt-0.5"
                  />
                  Địa chỉ
                </div>
                <span className="font-medium text-foreground text-right max-w-[60%]">
                  {sub.delivery_address}
                  {sub.delivery_district && `, ${sub.delivery_district}`}
                  {sub.delivery_city && `, ${sub.delivery_city}`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Tổng số lần giao</span>
              <span className="font-medium text-foreground">
                {sub.total_deliveries}
              </span>
            </div>

            {sub.skipped_count > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Số lần bỏ qua</span>
                <span className="font-medium text-foreground">
                  {sub.skipped_count}
                </span>
              </div>
            )}

            {sub.commitment_months > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Cam kết</span>
                <span className="font-medium text-foreground">
                  {sub.commitment_months} tháng (giảm {sub.discount_percent}%)
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Card message */}
        {sub.card_message && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Lời nhắn thiệp
            </h2>
            <div className="flex items-start gap-2">
              <MessageSquare
                size={15}
                className="text-gold shrink-0 mt-0.5"
              />
              <p className="text-sm text-foreground italic leading-relaxed">
                &ldquo;{sub.card_message}&rdquo;
              </p>
            </div>
          </Card>
        )}

        {/* Pricing */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Chi phí
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Giá combo</span>
              <span>{formatPrice(comboPrice)}</span>
            </div>
            {sub.discount_percent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">
                  Giảm giá cam kết
                </span>
                <span className="text-success">-{sub.discount_percent}%</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border-subtle">
              <span className="font-semibold text-foreground">
                Giá mỗi lần giao
              </span>
              <span className="font-display font-bold text-gold text-lg">
                {formatPrice(discountedPrice)}
              </span>
            </div>
          </div>
        </Card>

        {/* Delivery history */}
        {deliveries.length > 0 && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
              Lịch sử giao hàng
            </h2>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {deliveries.map((delivery, i) => {
                  const isLatest = i === 0;
                  const dCfg =
                    DELIVERY_STATUS_CONFIG[delivery.status] ||
                    DELIVERY_STATUS_CONFIG.scheduled;

                  return (
                    <div key={delivery.id} className="flex gap-3 relative">
                      {/* Dot */}
                      <div
                        className="w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center shrink-0 bg-surface z-10"
                        style={{ borderColor: dCfg.color }}
                      >
                        {isLatest && (
                          <CheckCircle2
                            size={13}
                            style={{ color: dCfg.color }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-medium"
                            style={{
                              color: isLatest ? dCfg.color : undefined,
                            }}
                          >
                            {formatDate(delivery.scheduled_date)}
                          </p>
                          <Badge
                            size="sm"
                            color={dCfg.color}
                            bgColor={dCfg.bgColor}
                          >
                            {dCfg.label}
                          </Badge>
                        </div>
                        {delivery.skip_reason && (
                          <p className="text-xs text-text-muted mt-0.5">
                            Lý do: {delivery.skip_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Paused/Cancelled info */}
        {sub.status === "paused" && sub.paused_at && (
          <Card padding="lg" className="border-warning/30">
            <p className="text-sm text-warning">
              Tạm dừng từ {formatDate(sub.paused_at)}
            </p>
          </Card>
        )}

        {sub.status === "cancelled" && sub.cancelled_at && (
          <Card padding="lg" className="border-error/30">
            <p className="text-sm text-error">
              Đã hủy ngày {formatDate(sub.cancelled_at)}
            </p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-4">
          {sub.status === "active" && (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleAction("pause")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "pause" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Pause size={16} />
                )}
                {actionLoading === "pause" ? "Đang xử lý..." : "Tạm dừng"}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowSkipConfirm(true)}
                disabled={actionLoading !== null}
              >
                <SkipForward size={16} />
                Bỏ qua lần tiếp
              </Button>
              <Button
                variant="ghost"
                className="text-error hover:bg-error-bg"
                onClick={() => setShowCancelConfirm(true)}
                disabled={actionLoading !== null}
              >
                <XCircle size={16} />
                Hủy
              </Button>
            </>
          )}

          {sub.status === "paused" && (
            <Button
              className="flex-1"
              onClick={() => handleAction("resume")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "resume" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {actionLoading === "resume" ? "Đang xử lý..." : "Tiếp tục"}
            </Button>
          )}
        </div>
      </div>

      {/* Skip confirmation overlay */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Bỏ qua lần giao tiếp theo
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Lần giao ngày{" "}
              <strong>{formatDate(sub.next_delivery_date)}</strong> sẽ được bỏ
              qua. Lần giao tiếp theo sẽ được tính từ ngày hiện tại +{" "}
              {freqCfg?.days || 7} ngày.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Lý do (tùy chọn)
              </label>
              <textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Nhập lý do bỏ qua..."
                rows={2}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowSkipConfirm(false);
                  setSkipReason("");
                }}
              >
                Quay lại
              </Button>
              <Button
                className="flex-1"
                onClick={handleSkip}
                disabled={actionLoading === "skip"}
              >
                {actionLoading === "skip" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <SkipForward size={16} />
                )}
                {actionLoading === "skip"
                  ? "Đang xử lý..."
                  : "Xác nhận bỏ qua"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation overlay */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Xác nhận hủy đăng ký
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Bạn có chắc chắn muốn hủy đăng ký định kỳ này? Thao tác này không
              thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
              >
                Quay lại
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleAction("cancel")}
                disabled={actionLoading === "cancel"}
              >
                {actionLoading === "cancel" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                {actionLoading === "cancel"
                  ? "Đang hủy..."
                  : "Xác nhận hủy"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
