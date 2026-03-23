"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/formatters";
import { Wallet, ArrowUpRight, ArrowDownRight, QrCode, Copy, Check } from "lucide-react";
import type { GiftWallet, GiftTransaction } from "@/types";

const PRESET_AMOUNTS = [500000, 1000000, 2000000, 5000000];

export default function WalletPage() {
  const [wallet, setWallet] = useState<GiftWallet | null>(null);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Topup state
  const [topupAmount, setTopupAmount] = useState<number>(0);
  const [topupData, setTopupData] = useState<{
    qr_url: string;
    topup_code: string;
    account_no: string;
    account_name: string;
    amount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/wallet");
    if (res.ok) {
      const w = await res.json();
      setWallet(w);
    }
    const txRes = await fetch("/api/wallet/transactions?limit=20");
    if (txRes.ok) {
      const txs = await txRes.json();
      setTransactions(txs);
    }
    setLoading(false);
  }

  async function handleTopup() {
    if (!topupAmount || topupAmount < 100000) return;
    setGenerating(true);
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: topupAmount }),
    });
    if (res.ok) {
      const data = await res.json();
      setTopupData(data);
    }
    setGenerating(false);
  }

  function copyCode(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-border rounded-xl" />
        <div className="h-64 bg-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display text-foreground">Ví của tôi</h1>

      {/* Balance */}
      <div className="bg-gold-bg border border-gold/20 rounded-xl p-6 text-center">
        <Wallet size={24} className="mx-auto text-gold mb-2" />
        <p className="text-sm text-text-secondary mb-1">Số dư hiện tại</p>
        <p className="text-4xl font-display font-bold text-gold">
          {formatPrice(Number(wallet?.balance || 0))}
        </p>
      </div>

      {/* Topup */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Nạp tiền
        </h2>

        {!topupData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopupAmount(amt)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    topupAmount === amt
                      ? "bg-gold text-white"
                      : "bg-background border border-border text-foreground hover:border-gold/30"
                  }`}
                >
                  {formatPrice(amt)}
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1 block">
                Hoặc nhập số tiền khác
              </label>
              <input
                type="number"
                value={topupAmount || ""}
                onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                placeholder="100.000"
                min={100000}
                step={100000}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>

            <button
              onClick={handleTopup}
              disabled={!topupAmount || topupAmount < 100000 || generating}
              className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {generating ? "Đang tạo mã..." : "Tạo mã nạp tiền"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              {topupData.qr_url && topupData.account_no ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={topupData.qr_url}
                  alt="QR nạp tiền"
                  className="mx-auto w-64 h-64 rounded-lg"
                />
              ) : (
                <div className="mx-auto w-64 h-64 rounded-lg bg-background flex items-center justify-center">
                  <QrCode size={48} className="text-text-muted" />
                </div>
              )}
            </div>

            <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Số tiền:</span>
                <span className="font-semibold text-gold">
                  {formatPrice(topupData.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Ngân hàng:</span>
                <span className="font-medium">Techcombank</span>
              </div>
              {topupData.account_no && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Số TK:</span>
                  <span className="font-medium">{topupData.account_no}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Nội dung CK:</span>
                <button
                  onClick={() => copyCode(topupData.topup_code)}
                  className="flex items-center gap-1 font-mono font-bold text-gold hover:text-gold-dark"
                >
                  {topupData.topup_code}
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-text-muted text-center">
              Sau khi chuyển khoản, số dư sẽ được cập nhật tự động trong vài phút.
            </p>

            <button
              onClick={() => {
                setTopupData(null);
                setTopupAmount(0);
              }}
              className="w-full py-2.5 border border-border rounded-xl text-sm text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Nạp số khác
            </button>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Lịch sử giao dịch
        </h2>

        {transactions.length === 0 ? (
          <p className="text-center text-text-muted py-8">
            Chưa có giao dịch nào
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
                    tx.amount > 0
                      ? "bg-success-bg text-success"
                      : "bg-gold-bg text-gold"
                  }`}
                >
                  {tx.amount > 0 ? (
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
                    {formatDate(tx.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.amount > 0 ? "text-success" : "text-foreground"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatPrice(Math.abs(tx.amount))}
                  </p>
                  <p className="text-xs text-text-muted">
                    Dư: {formatPrice(tx.balance_after)}
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
