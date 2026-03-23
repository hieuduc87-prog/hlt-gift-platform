import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionsList } from "./subscriptions-list";

export interface SubscriptionWithJoins {
  id: string;
  profile_id: string;
  recipient_id: string;
  combo_tier_id: string;
  frequency: string;
  status: string;
  delivery_address: string | null;
  delivery_district: string | null;
  delivery_city: string;
  delivery_time: string;
  card_message: string | null;
  next_delivery_date: string;
  commitment_months: number;
  discount_percent: number;
  total_deliveries: number;
  skipped_count: number;
  paused_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  gift_recipients: { full_name: string } | null;
  gift_combo_tiers: { name: string; price: number } | null;
}

export default async function SubscriptionsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscriptions } = await supabase
    .from("gift_subscriptions")
    .select("*, gift_recipients(full_name), gift_combo_tiers(name, price)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <SubscriptionsList
      initialSubscriptions={(subscriptions as unknown as SubscriptionWithJoins[]) || []}
    />
  );
}
