"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDateTime } from "@/lib/formatters";
import {
  Copy,
  Check,
  UserPlus,
  Gift,
  ArrowLeft,
  Loader2,
  Share2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface ReferralItem {
  id: string;
  referred_name: string;
  referred_email: string | null;
  status: string;
  reward_amount: number;
  referrer_rewarded: boolean;
  created_at: string;
}

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  async function fetchReferrals() {
    setLoading(true);
    const res = await fetch("/api/referrals");
    if (res.ok) {
      const data = await res.json();
      setReferralCode(data.referral_code);
      setReferrals(data.referrals);
    }
    setLoading(false);
  }

  async function generateCode() {
    setGenerating(true);
    const res = await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      setReferralCode(data.referral_code);
    }
    setGenerating(false);
  }

  function getReferralLink() {
    if (!referralCode) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/register?ref=${referralCode}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareViaZalo() {
    const link = getReferralLink();
    const text = `Mình đang dùng Hoa Lang Thang - dịch vụ tặng hoa tự động rất tiện! Đăng ký qua link này, cả hai mình nhận 50.000đ vào ví nhé: ${link}`;
    const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(zaloUrl, "_blank");
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-border rounded-xl w-48" />
        <div className="h-48 bg-border rounded-xl" />
        <div className="h-64 bg-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/loyalty"
          className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-display text-foreground">
          Giới thiệu bạn bè
        </h1>
      </div>

      {/* Reward info */}
      <div className="bg-gold-bg border border-gold/20 rounded-xl p-6 text-center">
        <Gift size={32} className="mx-auto text-gold mb-3" />
        <p className="text-lg font-display font-semibold text-foreground mb-2">
          Mỗi bạn bè đăng ký qua link của bạn
        </p>
        <p className="text-2xl font-display font-bold text-gold">
          Cả hai nhận 50.000đ
        </p>
        <p className="text-sm text-text-secondary mt-1">vào ví HLT</p>
      </div>

      {/* Referral Code */}
      {referralCode ? (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Mã giới thiệu của bạn
          </h2>

          {/* Code display */}
          <div
            className="flex items-center justify-center gap-3 p-4 rounded-xl border-2"
            style={{ borderColor: "#C9A96E" }}
          >
            <span className="text-2xl font-mono font-bold text-foreground tracking-wider">
              {referralCode}
            </span>
            <button
              onClick={() => copyToClipboard(referralCode)}
              className="p-2 rounded-lg bg-gold-bg text-gold hover:bg-gold/20 transition-colors"
              title="Sao chép mã"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          {/* Link display */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">
              Link giới thiệu
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                className="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text-secondary font-mono truncate"
              />
              <button
                onClick={() => copyToClipboard(getReferralLink())}
                className="px-4 py-2.5 bg-gold hover:bg-gold-dark text-white text-sm font-medium rounded-lg transition-colors shrink-0"
              >
                {copied ? "Đã sao chép!" : "Sao chép"}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareViaZalo}
              className="flex items-center justify-center gap-2 py-3 bg-[#0068FF] hover:bg-[#0055DD] text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Share2 size={16} />
              Chia sẻ qua Zalo
            </button>
            <button
              onClick={() => copyToClipboard(getReferralLink())}
              className="flex items-center justify-center gap-2 py-3 bg-background border border-border hover:border-gold/30 text-foreground rounded-xl transition-colors text-sm font-medium"
            >
              <Copy size={16} />
              Sao chép link
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center space-y-4">
          <UserPlus size={32} className="mx-auto text-text-muted" />
          <p className="text-text-secondary">
            Bạn chưa có mã giới thiệu. Tạo ngay để bắt đầu kiếm thưởng!
          </p>
          <button
            onClick={generateCode}
            disabled={generating}
            className="px-6 py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Đang tạo...
              </span>
            ) : (
              "Tạo mã giới thiệu"
            )}
          </button>
        </div>
      )}

      {/* Referral History */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Lịch sử giới thiệu
        </h2>
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-muted">
              Chưa có ai đăng ký qua link của bạn
            </p>
            <p className="text-xs text-text-muted mt-1">
              Chia sẻ link giới thiệu để bắt đầu nhận thưởng
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center gap-3 py-3 border-b border-border-subtle last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ref.status === "completed"
                      ? "bg-success-bg text-success"
                      : "bg-gold-bg text-gold"
                  }`}
                >
                  {ref.status === "completed" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {ref.referred_name}
                  </p>
                  {ref.referred_email && (
                    <p className="text-xs text-text-muted truncate">
                      {ref.referred_email}
                    </p>
                  )}
                  <p className="text-xs text-text-muted">
                    {formatDateTime(ref.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      ref.status === "completed"
                        ? "bg-success-bg text-success"
                        : "bg-gold-bg text-gold"
                    }`}
                  >
                    {ref.status === "completed" ? "Hoàn thành" : "Chờ xác nhận"}
                  </span>
                  <p className="text-sm font-semibold text-gold mt-1">
                    +{formatPrice(ref.reward_amount)}
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
