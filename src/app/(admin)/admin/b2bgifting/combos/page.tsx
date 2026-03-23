import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/formatters";
import type { GiftComboTier } from "@/types";
import { Layers, Plus } from "lucide-react";
import Link from "next/link";
import { ComboActiveToggle } from "./combo-active-toggle";

export default async function AdminCombosPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("gift_combo_tiers")
    .select("*")
    .order("sort_order", { ascending: true });

  const combos = (data || []) as GiftComboTier[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gold">Combo quà tặng</h1>
          <p className="mt-1 text-admin-text-secondary">
            Quản lý combo quà tặng ({combos.length})
          </p>
        </div>
        <Link
          href="/admin/b2bgifting/combos/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Thêm combo
        </Link>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {combos.length === 0 ? (
          <div className="p-12 text-center">
            <Layers size={36} className="mx-auto text-admin-text-secondary mb-3" />
            <p className="text-admin-text-secondary">Chưa có combo nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Tên</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium text-right">Giá</th>
                  <th className="px-5 py-3 font-medium text-center">Thứ tự</th>
                  <th className="px-5 py-3 font-medium text-center">Trạng thái</th>
                  <th className="px-5 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => (
                  <tr
                    key={combo.id}
                    className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3 text-admin-text font-medium">
                      {combo.name}
                    </td>
                    <td className="px-5 py-3 text-admin-text-secondary font-mono text-xs">
                      {combo.slug}
                    </td>
                    <td className="px-5 py-3 text-gold font-medium text-right">
                      {formatPrice(combo.price)}
                    </td>
                    <td className="px-5 py-3 text-admin-text-secondary text-center">
                      {combo.sort_order}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <ComboActiveToggle
                        comboId={combo.id}
                        isActive={combo.is_active}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/b2bgifting/combos/${combo.id}`}
                        className="text-gold hover:text-gold/80 text-sm font-medium transition-colors"
                      >
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
