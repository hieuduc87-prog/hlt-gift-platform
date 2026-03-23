import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { GiftProfile, GiftWallet } from "@/types";
import { Users } from "lucide-react";
import Link from "next/link";
import { ClientSearch } from "./client-search";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from("gift_profiles")
    .select("*, gift_wallets(balance)")
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (q && q.trim()) {
    const search = `%${q.trim()}%`;
    query = query.or(
      `full_name.ilike.${search},email.ilike.${search},phone.ilike.${search}`
    );
  }

  const { data } = await query;

  const clients = (data || []) as (GiftProfile & {
    gift_wallets: Pick<GiftWallet, "balance">[] | null;
  })[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gold">Khách hàng</h1>
          <p className="mt-1 text-admin-text-secondary">
            Quản lý khách hàng ({clients.length})
          </p>
        </div>
      </div>

      {/* Search */}
      <ClientSearch defaultValue={q || ""} />

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={36} className="mx-auto text-admin-text-secondary mb-3" />
            <p className="text-admin-text-secondary">
              {q ? "Không tìm thấy khách hàng nào" : "Chưa có khách hàng nào"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Tên</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">SĐT</th>
                  <th className="px-5 py-3 font-medium">Loại</th>
                  <th className="px-5 py-3 font-medium text-right">Số dư ví</th>
                  <th className="px-5 py-3 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const walletBalance =
                    client.gift_wallets && client.gift_wallets.length > 0
                      ? Number(client.gift_wallets[0].balance || 0)
                      : 0;
                  const roleLabel =
                    client.role === "business" ? "Doanh nghiệp" : "Cá nhân";

                  return (
                    <tr
                      key={client.id}
                      className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-admin-text font-medium hover:text-gold transition-colors"
                        >
                          {client.full_name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary">
                        {client.email || "—"}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary">
                        {client.phone || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.role === "business"
                              ? "bg-info-bg text-info"
                              : "bg-gold-bg text-gold"
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-admin-text font-medium text-right">
                        {formatPrice(walletBalance)}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary whitespace-nowrap">
                        {formatDate(client.created_at)}
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
