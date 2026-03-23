import { createServiceClient } from "@/lib/supabase/server";
import type { GiftOrder } from "@/types";
import { AdminOrdersClient } from "./orders-client";

export default async function AdminOrdersPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("gift_orders")
    .select(
      "*, gift_profiles(full_name), gift_combo_tiers(name), gift_recipients(full_name)"
    )
    .order("created_at", { ascending: false });

  const orders = (data || []) as (GiftOrder & {
    gift_profiles: { full_name: string } | null;
    gift_combo_tiers: { name: string } | null;
    gift_recipients: { full_name: string } | null;
  })[];

  return <AdminOrdersClient orders={orders} />;
}
