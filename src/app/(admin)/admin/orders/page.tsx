import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/formatters";
import { ORDER_STATUS_CONFIG } from "@/types";
import type { GiftOrder } from "@/types";
import { Package } from "lucide-react";

export default async function AdminOrdersPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("gift_orders")
    .select("*, gift_profiles(full_name), gift_combo_tiers(name)")
    .order("created_at", { ascending: false });

  const orders = (data || []) as (GiftOrder & {
    gift_profiles: { full_name: string } | null;
    gift_combo_tiers: { name: string } | null;
  })[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gold">Đơn hàng</h1>
          <p className="mt-1 text-admin-text-secondary">
            Tất cả đơn hàng trong hệ thống ({orders.length})
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={36} className="mx-auto text-admin-text-secondary mb-3" />
            <p className="text-admin-text-secondary">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Mã</th>
                  <th className="px-5 py-3 font-medium">Khách hàng</th>
                  <th className="px-5 py-3 font-medium">Người nhận</th>
                  <th className="px-5 py-3 font-medium">Combo</th>
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
                      className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-gold text-xs">
                        {order.code}
                      </td>
                      <td className="px-5 py-3 text-admin-text">
                        {order.gift_profiles?.full_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-admin-text">
                        {order.recipient_name}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary">
                        {order.gift_combo_tiers?.name || "—"}
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
        )}
      </div>
    </div>
  );
}
