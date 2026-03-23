import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/formatters";
import type {
  GiftProfile,
  GiftWallet,
  GiftOrder,
  GiftRecipient,
  GiftOccasion,
} from "@/types";
import { ORDER_STATUS_CONFIG } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ClientDetailTabs } from "./client-detail-tabs";

type ClientDetailData = {
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
};

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch all data in parallel
  const [profileRes, walletRes, ordersRes, recipientsRes] = await Promise.all([
    supabase.from("gift_profiles").select("*").eq("id", id).single(),
    supabase.from("gift_wallets").select("*").eq("profile_id", id).single(),
    supabase
      .from("gift_orders")
      .select("*")
      .eq("profile_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("gift_recipients")
      .select("*, gift_occasions(*)")
      .eq("profile_id", id)
      .order("full_name", { ascending: true }),
  ]);

  if (!profileRes.data) {
    return (
      <div className="text-center py-20">
        <p className="text-admin-text-secondary">Không tìm thấy khách hàng</p>
        <Link
          href="/admin/clients"
          className="text-gold hover:text-gold/80 text-sm mt-2 inline-block"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Get transactions if wallet exists
  let transactions: ClientDetailData["transactions"] = [];
  if (walletRes.data) {
    const txRes = await supabase
      .from("gift_transactions")
      .select("*")
      .eq("wallet_id", walletRes.data.id)
      .order("created_at", { ascending: false })
      .limit(50);
    transactions = txRes.data || [];
  }

  const data: ClientDetailData = {
    profile: profileRes.data as GiftProfile,
    wallet: (walletRes.data as GiftWallet) || null,
    orders: (ordersRes.data || []) as GiftOrder[],
    recipients: (recipientsRes.data || []) as (GiftRecipient & {
      gift_occasions: GiftOccasion[];
    })[],
    transactions,
  };

  const roleLabel =
    data.profile.role === "business"
      ? "Doanh nghiệp"
      : data.profile.role === "admin"
        ? "Admin"
        : "Cá nhân";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-text transition-colors"
      >
        <ArrowLeft size={14} />
        Khách hàng
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display text-gold">
            {data.profile.full_name}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                data.profile.role === "business"
                  ? "bg-info-bg text-info"
                  : "bg-gold-bg text-gold"
              }`}
            >
              {roleLabel}
            </span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                data.profile.is_active
                  ? "bg-success-bg text-success"
                  : "bg-error-bg text-error"
              }`}
            >
              {data.profile.is_active ? "Hoạt động" : "Ngừng hoạt động"}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-lg font-semibold text-gold">
              {formatPrice(data.wallet?.balance || 0)}
            </p>
            <p className="text-xs text-admin-text-secondary">Số dư ví</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-admin-text">
              {data.orders.length}
            </p>
            <p className="text-xs text-admin-text-secondary">Đơn hàng</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-admin-text">
              {data.recipients.length}
            </p>
            <p className="text-xs text-admin-text-secondary">Người nhận</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ClientDetailTabs
        profile={data.profile}
        wallet={data.wallet}
        orders={data.orders}
        recipients={data.recipients}
        transactions={data.transactions}
      />
    </div>
  );
}
