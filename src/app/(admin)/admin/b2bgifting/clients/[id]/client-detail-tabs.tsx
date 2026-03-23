"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/formatters";
import { ORDER_STATUS_CONFIG, RELATIONSHIP_CONFIG } from "@/types";
import type {
  GiftProfile,
  GiftWallet,
  GiftOrder,
  GiftRecipient,
  GiftOccasion,
} from "@/types";
import {
  User,
  ShoppingBag,
  Wallet,
  Users,
  Save,
  Loader2,
  Plus,
  Minus,
  X,
} from "lucide-react";

type Tab = "info" | "orders" | "wallet" | "recipients";

interface Props {
  profile: GiftProfile;
  wallet: GiftWallet | null;
  orders: GiftOrder[];
  recipients: (GiftRecipient & { gift_occasions: GiftOccasion[] })[];
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string | null;
    created_at: string;
  }>;
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  topup: { label: "Nạp tiền", color: "text-success" },
  purchase: { label: "Mua hàng", color: "text-error" },
  refund: { label: "Hoàn tiền", color: "text-info" },
  bonus: { label: "Thưởng", color: "text-gold" },
  adjustment: { label: "Điều chỉnh", color: "text-admin-text-secondary" },
};

export function ClientDetailTabs({
  profile,
  wallet,
  orders,
  recipients,
  transactions,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] =
    [
      { key: "info", label: "Thông tin", icon: <User size={16} /> },
      {
        key: "orders",
        label: "Đơn hàng",
        icon: <ShoppingBag size={16} />,
        count: orders.length,
      },
      { key: "wallet", label: "Ví", icon: <Wallet size={16} /> },
      {
        key: "recipients",
        label: "Người nhận",
        icon: <Users size={16} />,
        count: recipients.length,
      },
    ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-admin-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-gold text-gold"
                : "border-transparent text-admin-text-secondary hover:text-admin-text"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-xs bg-admin-surface-hover px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <TabInfo profile={profile} />
      )}
      {activeTab === "orders" && (
        <TabOrders orders={orders} />
      )}
      {activeTab === "wallet" && (
        <TabWallet
          wallet={wallet}
          transactions={transactions}
          profileId={profile.id}
          onRefresh={() => router.refresh()}
        />
      )}
      {activeTab === "recipients" && (
        <TabRecipients recipients={recipients} />
      )}
    </div>
  );
}

// ============================================================
// TAB: Thong tin
// ============================================================
function TabInfo({ profile }: { profile: GiftProfile }) {
  const [notes, setNotes] = useState(profile.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        await fetch(`/api/admin/clients/${profile.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_notes: value }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 1000);
    },
    [profile.id]
  );

  function handleNotesChange(value: string) {
    setNotes(value);
    setSaved(false);
    autoSave(value);
  }

  const inputClass =
    "w-full bg-[#1A1A1A] border border-admin-border text-admin-text rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold";

  const fields = [
    { label: "Họ tên", value: profile.full_name },
    { label: "Email", value: profile.email || "—" },
    { label: "Số điện thoại", value: profile.phone || "—" },
    {
      label: "Loại tài khoản",
      value:
        profile.role === "business"
          ? "Doanh nghiệp"
          : profile.role === "admin"
            ? "Admin"
            : "Cá nhân",
    },
    { label: "Công ty", value: profile.company_name || "—" },
    { label: "Mã số thuế", value: profile.company_tax_code || "—" },
    { label: "Địa chỉ công ty", value: profile.company_address || "—" },
    { label: "Nguồn", value: profile.source || "—" },
    { label: "Ngày tạo", value: formatDate(profile.created_at) },
    {
      label: "Hoạt động gần nhất",
      value: profile.last_active_at
        ? formatDate(profile.last_active_at)
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile fields */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-admin-text-secondary mb-4">
          Thông tin cá nhân
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="text-xs text-admin-text-secondary mb-0.5">
                {field.label}
              </p>
              <p className="text-sm text-admin-text">{field.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admin notes */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-admin-text-secondary">
            Ghi chú quản trị
          </h3>
          <div className="flex items-center gap-2 text-xs">
            {saving && (
              <span className="flex items-center gap-1 text-admin-text-secondary">
                <Loader2 size={12} className="animate-spin" />
                Đang lưu...
              </span>
            )}
            {saved && (
              <span className="flex items-center gap-1 text-success">
                <Save size={12} />
                Đã lưu
              </span>
            )}
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={4}
          placeholder="Ghi chú nội bộ về khách hàng này..."
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-xs text-admin-text-secondary">
          Tự động lưu sau khi ngừng gõ 1 giây.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// TAB: Don hang
// ============================================================
function TabOrders({ orders }: { orders: GiftOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-admin-surface border border-admin-border rounded-xl p-12 text-center">
        <ShoppingBag
          size={36}
          className="mx-auto text-admin-text-secondary mb-3"
        />
        <p className="text-admin-text-secondary">Chưa có đơn hàng nào</p>
      </div>
    );
  }

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border text-admin-text-secondary text-left">
              <th className="px-5 py-3 font-medium">Mã</th>
              <th className="px-5 py-3 font-medium">Người nhận</th>
              <th className="px-5 py-3 font-medium text-right">Tổng</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status];
              return (
                <tr
                  key={order.id}
                  className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/admin/b2bgifting/orders/${order.id}`)
                  }
                >
                  <td className="px-5 py-3 font-mono text-gold text-xs">
                    {order.code}
                  </td>
                  <td className="px-5 py-3 text-admin-text">
                    {order.recipient_name}
                  </td>
                  <td className="px-5 py-3 text-admin-text font-medium text-right">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        color: statusCfg.color,
                        backgroundColor: statusCfg.bgColor,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-admin-text-secondary whitespace-nowrap">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// TAB: Vi
// ============================================================
function TabWallet({
  wallet,
  transactions,
  profileId,
  onRefresh,
}: {
  wallet: GiftWallet | null;
  transactions: Props["transactions"];
  profileId: string;
  onRefresh: () => void;
}) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setAdjustError("");
    const amount = Number(adjustAmount);
    if (!amount) {
      setAdjustError("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (!adjustDesc.trim()) {
      setAdjustError("Vui lòng nhập lý do");
      return;
    }

    setAdjusting(true);
    const res = await fetch(`/api/admin/clients/${profileId}/wallet-adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        description: adjustDesc.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setAdjustError(data.error || "Có lỗi xảy ra");
      setAdjusting(false);
      return;
    }

    setShowAdjust(false);
    setAdjustAmount("");
    setAdjustDesc("");
    setAdjusting(false);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      {/* Wallet summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
          <p className="text-2xl font-semibold text-gold">
            {formatPrice(wallet?.balance || 0)}
          </p>
          <p className="text-sm text-admin-text-secondary mt-1">Số dư hiện tại</p>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
          <p className="text-2xl font-semibold text-success">
            {formatPrice(wallet?.total_topup || 0)}
          </p>
          <p className="text-sm text-admin-text-secondary mt-1">Tổng nạp</p>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
          <p className="text-2xl font-semibold text-error">
            {formatPrice(wallet?.total_spent || 0)}
          </p>
          <p className="text-sm text-admin-text-secondary mt-1">Tổng chi</p>
        </div>
      </div>

      {/* Adjust button */}
      <div>
        <button
          onClick={() => setShowAdjust(!showAdjust)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold/20 text-gold hover:bg-gold/30 text-sm font-medium rounded-lg transition-colors"
        >
          <Wallet size={16} />
          Điều chỉnh số dư
        </button>
      </div>

      {/* Adjust form */}
      {showAdjust && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-admin-text">
              Điều chỉnh số dư ví
            </h3>
            <button
              onClick={() => setShowAdjust(false)}
              className="text-admin-text-secondary hover:text-admin-text"
            >
              <X size={16} />
            </button>
          </div>

          {adjustError && (
            <div className="mb-3 p-2.5 bg-red-900/30 border border-red-700/50 text-red-400 rounded-lg text-sm">
              {adjustError}
            </div>
          )}

          <form onSubmit={handleAdjust} className="space-y-4">
            <div>
              <label className="block text-sm text-admin-text-secondary mb-1.5">
                Số tiền (dương = cộng, âm = trừ)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const val = Number(adjustAmount);
                    if (val > 0) setAdjustAmount((-val).toString());
                    else if (!adjustAmount) setAdjustAmount("-");
                  }}
                  className="px-3 py-2.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="100000"
                  className="flex-1 bg-[#1A1A1A] border border-admin-border text-admin-text rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = Number(adjustAmount);
                    if (val < 0) setAdjustAmount((-val).toString());
                  }}
                  className="px-3 py-2.5 bg-green-900/30 text-green-400 hover:bg-green-900/50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-admin-text-secondary mb-1.5">
                Lý do điều chỉnh
              </label>
              <input
                type="text"
                value={adjustDesc}
                onChange={(e) => setAdjustDesc(e.target.value)}
                placeholder="VD: Bồi hoàn đơn hàng #123"
                className="w-full bg-[#1A1A1A] border border-admin-border text-admin-text rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>

            <button
              type="submit"
              disabled={adjusting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {adjusting && <Loader2 size={14} className="animate-spin" />}
              Xác nhận điều chỉnh
            </button>
          </form>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border">
          <h3 className="text-sm font-medium text-admin-text">
            Lịch sử giao dịch
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-admin-text-secondary">
            Chưa có giao dịch nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Loại</th>
                  <th className="px-5 py-3 font-medium">Mô tả</th>
                  <th className="px-5 py-3 font-medium text-right">Số tiền</th>
                  <th className="px-5 py-3 font-medium text-right">
                    Số dư sau
                  </th>
                  <th className="px-5 py-3 font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const txCfg = TX_TYPE_LABELS[tx.type] || {
                    label: tx.type,
                    color: "text-admin-text",
                  };
                  const isPositive = tx.amount > 0;
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                    >
                      <td className={`px-5 py-3 font-medium ${txCfg.color}`}>
                        {txCfg.label}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary max-w-[200px] truncate">
                        {tx.description || "—"}
                      </td>
                      <td
                        className={`px-5 py-3 font-medium text-right ${
                          isPositive ? "text-success" : "text-error"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatPrice(tx.amount)}
                      </td>
                      <td className="px-5 py-3 text-admin-text text-right">
                        {formatPrice(tx.balance_after)}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB: Nguoi nhan
// ============================================================
function TabRecipients({
  recipients,
}: {
  recipients: (GiftRecipient & { gift_occasions: GiftOccasion[] })[];
}) {
  if (recipients.length === 0) {
    return (
      <div className="bg-admin-surface border border-admin-border rounded-xl p-12 text-center">
        <Users size={36} className="mx-auto text-admin-text-secondary mb-3" />
        <p className="text-admin-text-secondary">Chưa có người nhận nào</p>
      </div>
    );
  }

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border text-admin-text-secondary text-left">
              <th className="px-5 py-3 font-medium">Tên</th>
              <th className="px-5 py-3 font-medium">Quan hệ</th>
              <th className="px-5 py-3 font-medium">SĐT</th>
              <th className="px-5 py-3 font-medium">Thành phố</th>
              <th className="px-5 py-3 font-medium text-center">
                Số dịp
              </th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => {
              const relCfg = RELATIONSHIP_CONFIG[r.relationship];
              return (
                <tr
                  key={r.id}
                  className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                >
                  <td className="px-5 py-3 text-admin-text font-medium">
                    {r.full_name}
                  </td>
                  <td className="px-5 py-3 text-admin-text-secondary">
                    {relCfg?.icon} {relCfg?.label || r.relationship}
                  </td>
                  <td className="px-5 py-3 text-admin-text-secondary">
                    {r.phone || "—"}
                  </td>
                  <td className="px-5 py-3 text-admin-text-secondary">
                    {r.city || "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-bg text-gold">
                      {r.gift_occasions?.length || 0}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
