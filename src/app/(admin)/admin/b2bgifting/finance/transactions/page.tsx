"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Loader2,
} from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/formatters";
import type { GiftWalletTxType } from "@/types";

// ────────────────────────────────────────────
// Config
// ────────────────────────────────────────────
const TX_TYPE_CONFIG: Record<
  GiftWalletTxType,
  { label: string; color: string; bgColor: string; direction: "in" | "out" }
> = {
  topup: { label: "Nạp tiền", color: "#3A7D54", bgColor: "#E8F5ED", direction: "in" },
  purchase: { label: "Mua hàng", color: "#E85C5C", bgColor: "#F8EDED", direction: "out" },
  refund: { label: "Hoàn tiền", color: "#2C5F8A", bgColor: "#E8F0F8", direction: "in" },
  bonus: { label: "Thưởng", color: "#C9A96E", bgColor: "#FDF8F0", direction: "in" },
  adjustment: {
    label: "Điều chỉnh",
    color: "#9A9490",
    bgColor: "#F5F3F0",
    direction: "out",
  },
};

const TX_TYPES: { key: string; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "topup", label: "Nạp tiền" },
  { key: "purchase", label: "Mua hàng" },
  { key: "refund", label: "Hoàn tiền" },
  { key: "bonus", label: "Thưởng" },
  { key: "adjustment", label: "Điều chỉnh" },
];

interface TransactionRow {
  id: string;
  type: GiftWalletTxType;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  gift_wallets: {
    gift_profiles: { full_name: string } | null;
  } | null;
}

const PAGE_SIZE = 50;

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchTransactions = useCallback(
    async (offset: number, append: boolean) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          offset: String(offset),
          limit: String(PAGE_SIZE),
        });
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);

        const res = await fetch(
          `/api/admin/finance/transactions?${params.toString()}`
        );
        const data = await res.json();

        if (append) {
          setTransactions((prev) => [...prev, ...data]);
        } else {
          setTransactions(data);
        }
        setHasMore(data.length >= PAGE_SIZE);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [typeFilter, dateFrom, dateTo]
  );

  useEffect(() => {
    fetchTransactions(0, false);
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    fetchTransactions(transactions.length, true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/b2bgifting/finance"
          className="p-2 rounded-lg bg-admin-surface border border-admin-border hover:bg-admin-surface-hover transition-colors"
        >
          <ArrowLeft size={18} className="text-admin-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-display text-gold">
            Lịch sử giao dịch
          </h1>
          <p className="mt-1 text-admin-text-secondary">
            Tất cả giao dịch trong hệ thống
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3 text-admin-text-secondary text-sm">
          <Filter size={14} />
          Bộ lọc
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Type filter */}
          <div className="flex gap-1 flex-wrap">
            {TX_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === t.key
                    ? "bg-gold text-white"
                    : "bg-admin-surface-hover text-admin-text-secondary hover:text-admin-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 bg-admin-bg border border-admin-border rounded-lg text-xs text-admin-text focus:outline-none focus:border-gold/50"
              placeholder="Từ ngày"
            />
            <span className="text-admin-text-secondary text-xs">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 bg-admin-bg border border-admin-border rounded-lg text-xs text-admin-text focus:outline-none focus:border-gold/50"
              placeholder="Đến ngày"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2
              size={24}
              className="mx-auto text-gold animate-spin mb-3"
            />
            <p className="text-admin-text-secondary text-sm">
              Đang tải...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-admin-text-secondary">
            Không có giao dịch nào
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                    <th className="px-5 py-3 font-medium w-8"></th>
                    <th className="px-5 py-3 font-medium">Loại</th>
                    <th className="px-5 py-3 font-medium">Khách hàng</th>
                    <th className="px-5 py-3 font-medium">Mô tả</th>
                    <th className="px-5 py-3 font-medium text-right">
                      Số tiền
                    </th>
                    <th className="px-5 py-3 font-medium text-right">
                      Số dư sau
                    </th>
                    <th className="px-5 py-3 font-medium">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const txCfg = TX_TYPE_CONFIG[tx.type];
                    const isIn = txCfg.direction === "in";

                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                      >
                        <td className="px-5 py-3">
                          {isIn ? (
                            <ArrowDownLeft
                              size={16}
                              className="text-success"
                            />
                          ) : (
                            <ArrowUpRight size={16} className="text-error" />
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              color: txCfg.color,
                              backgroundColor: txCfg.bgColor,
                            }}
                          >
                            {txCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-admin-text">
                          {tx.gift_wallets?.gift_profiles?.full_name ||
                            "\u2014"}
                        </td>
                        <td className="px-5 py-3 text-admin-text-secondary max-w-[250px] truncate">
                          {tx.description || "\u2014"}
                        </td>
                        <td
                          className={`px-5 py-3 font-medium text-right ${
                            isIn ? "text-success" : "text-error"
                          }`}
                        >
                          {isIn ? "+" : "-"}
                          {formatPrice(Math.abs(tx.amount))}
                        </td>
                        <td className="px-5 py-3 text-admin-text text-right">
                          {formatPrice(tx.balance_after)}
                        </td>
                        <td className="px-5 py-3 text-admin-text-secondary whitespace-nowrap">
                          {formatDateTime(tx.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="p-4 text-center border-t border-admin-border">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-admin-surface-hover rounded-lg text-sm text-admin-text hover:bg-gold/10 hover:text-gold transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Đang tải...
                    </span>
                  ) : (
                    "Tải thêm"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
