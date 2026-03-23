import { createServerSupabase } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { GiftOrder, GiftOrderTimelineEvent, GiftComboTier, GiftRecipient } from "@/types";
import { OrderDetail } from "./order-detail";

export interface OrderWithJoins extends GiftOrder {
  gift_combo_tiers: Pick<GiftComboTier, "name" | "price"> | null;
  gift_recipients: Pick<GiftRecipient, "full_name" | "phone"> | null;
  gift_order_timeline_events: GiftOrderTimelineEvent[];
}

export default async function OrderDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order, error } = await supabase
    .from("gift_orders")
    .select(
      "*, gift_combo_tiers(name, price), gift_recipients(full_name, phone), gift_order_timeline_events(*)"
    )
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !order) notFound();

  return <OrderDetail order={order as unknown as OrderWithJoins} />;
}
