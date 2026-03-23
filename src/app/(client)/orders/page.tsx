import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { GiftOrder } from "@/types";
import { OrdersList } from "./orders-list";

export default async function OrdersPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("gift_orders")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return <OrdersList initialOrders={(orders as GiftOrder[]) || []} />;
}
