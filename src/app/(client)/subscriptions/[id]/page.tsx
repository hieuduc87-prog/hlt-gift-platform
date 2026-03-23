import { createServerSupabase } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type {
  GiftSubscription,
  GiftSubscriptionDelivery,
  GiftComboTier,
  GiftRecipient,
} from "@/types";
import { SubscriptionDetail } from "./subscription-detail";

export interface SubscriptionDetailData extends GiftSubscription {
  gift_recipients: Pick<GiftRecipient, "full_name" | "phone"> | null;
  gift_combo_tiers: Pick<GiftComboTier, "name" | "price"> | null;
  gift_subscription_deliveries: GiftSubscriptionDelivery[];
}

export default async function SubscriptionDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription, error } = await supabase
    .from("gift_subscriptions")
    .select(
      "*, gift_recipients(full_name, phone), gift_combo_tiers(name, price), gift_subscription_deliveries(*)"
    )
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !subscription) notFound();

  return (
    <SubscriptionDetail
      subscription={subscription as unknown as SubscriptionDetailData}
    />
  );
}
