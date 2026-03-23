"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDateTime } from "@/lib/formatters";
import { LOYALTY_TIER_CONFIG } from "@/types";
import type { GiftLoyaltyAccount, GiftLoyaltyTransaction, GiftLoyaltyTier } from "@/types";
import Link from "next/link";
import {
  Star,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  UserPlus,
  Loader2,
} from "lucide-react";

const TIER_ORDER: GiftLoyaltyTier[] = ["silver", "gold", "diamond"];

function getNextTier(current: GiftLoyaltyTier): GiftLoyaltyTier | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < TIER_ORDER.length - 1) return TIER_ORDER[idx + 1];
  return null;
}

function getTierProgress(account: GiftLoyaltyAccount): {
  percent: number;
  pointsToNext: number;
  nextTier: GiftLoyaltyTier | null;
} {
  const nextTier = getNextTier(account.tier);
  if (!nextTier) return { percent: 100, pointsToNext: 0, nextTier: null };

  const nextConfig = LOYALTY_TIER_CONFIG[nextTier];
  const currentConfig = LOYALTY_TIER_CONFIG[account.tier];
  const range = nextConfig.minSpend - currentConfig.minSpend;
  const progress = account.lifetime_spend - currentConfig.minSpend;
  const percent = Math.min(100, Math.max(0, (progress / range) * 100));
  const remaining = Math.max(0, nextConfig.minSpend - account.lifetime_spend);

  return { percent, pointsToNext: remaining, nextTier };
}

export default function LoyaltyPage() {
  const [account, setAccount] = useState<GiftLoyaltyAccount | null>(null);
  const [transactions, setTransactions] = useState<GiftLoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyalty();
  }, []);

  async function fetchLoyalty() {
    setLoading(true);
    const res = await fetch("/api/loyalty");
    if (res.ok) {
      const data = await res.json();
      setAccount(data.account);
      setTransactions(data.transactions);
    }
    setLoading(false);
  }

  async function handleRedeem() {
    if (!redeemPoints || redeemPoints < 10000) return;
    setRedeeming(true);
    setRedeemMsg(null);

    const res = await fetch("/api/loyalty/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: redeemPoints }),
    });

    const data = await res.json();
    if (res.ok) {
      setRedeemMsg(`Đổi thành công ${redeemPoints.toLocaleString("vi-VN")} điểm thành ${formatPrice(data.vnd_credited)} vào ví!`);
      setRedeemPoints(0);
      fetchLoyalty();
    } else {
      setRedeemMsg(data.error || "Có lỗi xảy ra");
    }
    setRedeeming(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-border rounded-xl" />
        <div className="h-32 bg-border rounded-xl" />
        <div className="h-64 bg-border rounded-xl" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <Star size={48} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-secondary">Không thể tải thông tin tích điểm</p>
      </div>
    );
  }

  const tierConfig = LOYALTY_TIER_CONFIG[account.tier];
  const progress = getTierProgress(account);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display text-foreground">Tích điểm</h1>

      {/* Hero: Tier Badge + Points */}
      <div
        className="rounded-xl p-6 text-center border"
        style={{
          backgroundColor: tierConfig.color + "10",
          borderColor: tierConfig.color + "30",
        }}
      >
        <div className="text-4xl mb-2">{tierConfig.icon}</div>
        <p
          className="text-lg font-display font-semibold"
          style={{ color: tierConfig.color }}
        >
          Hạng {tierConfig.label}
        </p>
        <p className="text-xs text-text-secondary mt-1 mb-4">
          Hệ số tích điểm: x{tierConfig.multiplier}
        </p>

        <p className="text-4xl font-display font-bold text-foreground">
          {account.points_balance.toLocaleString("vi-VN")}
        </p>
        <p className="text-sm text-text-secondary mt-1">điểm</p>

        {/* Progress bar to next tier */}
        {progress.nextTier && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-text-secondary mb-2">
              <span>{LOYALTY_TIER_CONFIG[account.tier].label}</span>
              <span>{LOYALTY_TIER_CONFIG[progress.nextTier].label}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percent}%`,
                  backgroundColor: "#C9A96E",
                }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {"Còn "}
              {formatPrice(progress.pointsToNext)}
              {" chi tiêu để lên "}
              <span style={{ color: LOYALTY_TIER_CONFIG[progress.nextTier].color, fontWeight: 600 }}>
                {LOYALTY_TIER_CONFIG[progress.nextTier].icon} {LOYALTY_TIER_CONFIG[progress.nextTier].label}
              </span>
            </p>
          </div>
        )}
        {!progress.nextTier && (
          <p className="text-xs text-text-muted mt-4">
            Bạn đã đạt hạng cao nhất!
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Cách tích điểm
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-bg flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Tích 1% giá trị đơn hàng
              </p>
              <p className="text-xs text-text-muted">
                Mỗi 100.000đ chi tiêu = 1.000 điểm
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-bg flex items-center justify-center shrink-0">
              <Star size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Hệ số nhân theo hạng
              </p>
              <p className="text-xs text-text-muted">
                Bạc x1 · Vàng x1.5 · Kim Cương x2
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-bg flex items-center justify-center shrink-0">
              <Gift size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Đổi điểm thành tiền vào ví
              </p>
              <p className="text-xs text-text-muted">
                1 điểm = 1đ · Đổi tối thiểu 10.000 điểm
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Points */}
      {account.points_balance >= 10000 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Đổi điểm
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">
                Số điểm muốn đổi (tối thiểu 10.000)
              </label>
              <input
                type="number"
                value={redeemPoints || ""}
                onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                placeholder="10000"
                min={10000}
                max={account.points_balance}
                step={1000}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
              {redeemPoints > 0 && (
                <p className="text-xs text-text-muted mt-1">
                  = {formatPrice(redeemPoints)} vào ví
                </p>
              )}
            </div>
            <button
              onClick={handleRedeem}
              disabled={!redeemPoints || redeemPoints < 10000 || redeemPoints > account.points_balance || redeeming}
              className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {redeeming ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Đang đổi...
                </span>
              ) : (
                "Đổi điểm"
              )}
            </button>
            {redeemMsg && (
              <p className={`text-sm text-center ${redeemMsg.includes("thành công") ? "text-success" : "text-error"}`}>
                {redeemMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Referral CTA */}
      <Link
        href="/loyalty/referral"
        className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl hover:border-gold/30 transition-colors group"
      >
        <div className="w-10 h-10 rounded-lg bg-gold-bg flex items-center justify-center text-gold">
          <UserPlus size={20} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">Giới thiệu bạn bè</p>
          <p className="text-sm text-text-muted">
            Cả hai nhận 50.000đ vào ví
          </p>
        </div>
        <ArrowUpRight
          size={16}
          className="text-text-muted group-hover:text-gold transition-colors"
        />
      </Link>

      {/* Recent Transactions */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Lịch sử điểm
        </h2>
        {transactions.length === 0 ? (
          <p className="text-center text-text-muted py-8">
            Chưa có giao dịch điểm nào
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.points > 0
                      ? "bg-success-bg text-success"
                      : "bg-gold-bg text-gold"
                  }`}
                >
                  {tx.points > 0 ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.description || tx.type}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDateTime(tx.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.points > 0 ? "text-success" : "text-foreground"
                    }`}
                  >
                    {tx.points > 0 ? "+" : ""}
                    {tx.points.toLocaleString("vi-VN")} điểm
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
