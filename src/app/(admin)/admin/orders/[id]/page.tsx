import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type {
  GiftOrder,
  GiftOrderTimelineEvent,
  GiftComboTier,
  GiftProfile,
  GiftRecipient,
} from "@/types";
import { OrderDetailClient } from "./order-detail-client";

type OrderWithJoins = GiftOrder & {
  gift_profiles: Pick<GiftProfile, "full_name" | "phone" | "email"> | null;
  gift_combo_tiers: Pick<GiftComboTier, "name" | "price"> | null;
  gift_recipients: Pick<
    GiftRecipient,
    "full_name" | "phone" | "address"
  > | null;
  gift_order_timeline_events: GiftOrderTimelineEvent[];
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("gift_orders")
    .select(
      `
      *,
      gift_profiles(full_name, phone, email),
      gift_combo_tiers(name, price),
      gift_recipients(full_name, phone, address),
      gift_order_timeline_events(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const order = data as OrderWithJoins;

  // Sort timeline events by created_at descending
  if (order.gift_order_timeline_events) {
    order.gift_order_timeline_events.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return <OrderDetailClient order={order} />;
}
