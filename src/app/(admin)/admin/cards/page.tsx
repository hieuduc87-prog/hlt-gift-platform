import { createServiceClient } from "@/lib/supabase/server";
import { OCCASION_CONFIG } from "@/types";
import type { GiftCardTemplate } from "@/types";
import { Palette } from "lucide-react";
import Image from "next/image";

export default async function AdminCardsPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("gift_card_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  const templates = (data || []) as GiftCardTemplate[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-gold">Thiệp mẫu</h1>
        <p className="mt-1 text-admin-text-secondary">
          Quản lý mẫu thiệp chúc mừng ({templates.length})
        </p>
      </div>

      {/* Grid */}
      {templates.length === 0 ? (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-12 text-center">
          <Palette size={36} className="mx-auto text-admin-text-secondary mb-3" />
          <p className="text-admin-text-secondary">Chưa có mẫu thiệp nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((tpl) => {
            const occasionCfg = tpl.occasion_type
              ? OCCASION_CONFIG[tpl.occasion_type]
              : null;
            return (
              <div
                key={tpl.id}
                className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-admin-surface-hover relative flex items-center justify-center">
                  {tpl.thumbnail_url ? (
                    <Image
                      src={tpl.thumbnail_url}
                      alt={tpl.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Palette size={32} className="text-admin-text-secondary" />
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-medium text-admin-text truncate">
                    {tpl.name}
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
                    {occasionCfg && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          color: occasionCfg.color,
                          backgroundColor: occasionCfg.color + "18",
                        }}
                      >
                        {occasionCfg.icon} {occasionCfg.label}
                      </span>
                    )}

                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        tpl.is_active
                          ? "bg-success-bg text-success"
                          : "bg-error-bg text-error"
                      }`}
                    >
                      {tpl.is_active ? "Hiện" : "Ẩn"}
                    </span>
                  </div>

                  <p className="text-xs text-admin-text-secondary">
                    Thứ tự: {tpl.sort_order}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
