"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, CalendarClock, CalendarDays, Repeat, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GiftSubscriptionStatus } from "@/types";
import { SUBSCRIPTION_STATUS_CONFIG, FREQUENCY_CONFIG } from "@/types";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { SubscriptionWithJoins } from "./page";

// ────────────────────────────────────────────
// Tab definitions
// ────────────────────────────────────────────
interface StatusTab {
  key: string;
  label: string;
  statuses: GiftSubscriptionStatus[] | null;
}

const TABS: StatusTab[] = [
  { key: "all", label: "Tất cả", statuses: null },
  { key: "active", label: "Đang hoạt động", statuses: ["active"] },
  { key: "paused", label: "Tạm dừng", statuses: ["paused"] },
  { key: "ended", label: "Đã kết thúc", statuses: ["cancelled", "expired"] },
];

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────
interface Props {
  initialSubscriptions: SubscriptionWithJoins[];
}

export function SubscriptionsList({ initialSubscriptions }: Props) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab || !tab.statuses) return initialSubscriptions;
    return initialSubscriptions.filter((s) =>
      tab.statuses!.includes(s.status as GiftSubscriptionStatus)
    );
  }, [initialSubscriptions, activeTab]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tab of TABS) {
      if (!tab.statuses) {
        map[tab.key] = initialSubscriptions.length;
      } else {
        map[tab.key] = initialSubscriptions.filter((s) =>
          tab.statuses!.includes(s.status as GiftSubscriptionStatus)
        ).length;
      }
    }
    return map;
  }, [initialSubscriptions]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Đăng ký định kỳ
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {initialSubscriptions.length} đăng ký
          </p>
        </div>
        <Link href="/subscriptions/new">
          <Button size="sm">
            <Plus size={16} />
            Tạo đăng ký mới
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

      {/* Subscription list or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarClock />}
          title={
            activeTab !== "all"
              ? "Không có đăng ký nào"
              : "Chưa có đăng ký định kỳ"
          }
          description={
            activeTab !== "all"
              ? "Không có đăng ký nào trong trạng thái này"
              : "Tạo đăng ký định kỳ để tự động gửi quà cho người thân yêu"
          }
          action={
            activeTab === "all" && (
              <Link href="/subscriptions/new">
                <Button size="sm">
                  <CalendarClock size={16} />
                  Tạo đăng ký mới
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Subscription card
// ────────────────────────────────────────────
function SubscriptionCard({
  subscription: sub,
}: {
  subscription: SubscriptionWithJoins;
}) {
  const statusCfg =
    SUBSCRIPTION_STATUS_CONFIG[sub.status as GiftSubscriptionStatus];
  const freqCfg =
    FREQUENCY_CONFIG[sub.frequency as keyof typeof FREQUENCY_CONFIG];

  return (
    <Link href={`/subscriptions/${sub.id}`}>
      <Card variant="hover" className="cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground truncate">
                {sub.gift_recipients?.full_name || "—"}
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
                <User size={13} className="text-text-muted" />
                {sub.gift_combo_tiers?.name || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Repeat size={13} className="text-text-muted" />
                {freqCfg?.label || sub.frequency}
              </span>
              {sub.status === "active" && sub.next_delivery_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} className="text-text-muted" />
                  {formatDate(sub.next_delivery_date)}
                </span>
              )}
            </div>
          </div>

          {/* Right: Price */}
          <div className="shrink-0 text-right">
            <p className="font-display font-bold text-gold">
              {formatPrice(sub.gift_combo_tiers?.price || 0)}
            </p>
            <p className="text-xs text-text-muted">
              /{freqCfg?.label || sub.frequency}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
