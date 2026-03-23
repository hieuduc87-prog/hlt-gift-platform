import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Yesterday's date range
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const statDate = yesterday.toISOString().split("T")[0];
  const dayStart = `${statDate}T00:00:00`;
  const dayEnd = `${statDate}T23:59:59`;

  // Aggregate data in parallel
  const [ordersRes, topupRes, newClientsRes, subsRes] = await Promise.all([
    // Orders created yesterday (not cancelled)
    supabase
      .from("gift_orders")
      .select("id, total, combo_tier_id, gift_combo_tiers(name)")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .neq("status", "cancelled"),

    // Topup transactions yesterday
    supabase
      .from("gift_transactions")
      .select("amount")
      .eq("type", "topup")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),

    // New profiles created yesterday (not admin)
    supabase
      .from("gift_profiles")
      .select("id", { count: "exact", head: true })
      .neq("role", "admin")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),

    // Active subscriptions count
    supabase
      .from("gift_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const orders = ordersRes.data || [];
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const totalTopup = (topupRes.data || []).reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );

  const newClients = newClientsRes.count || 0;
  const activeSubscriptions = subsRes.count || 0;

  // Aggregate orders by combo
  const ordersByCombo: Record<string, number> = {};
  for (const order of orders) {
    const comboJoin = (order as unknown as { gift_combo_tiers: { name: string } | { name: string }[] | null }).gift_combo_tiers;
    const comboName = Array.isArray(comboJoin)
      ? comboJoin[0]?.name || "Không có combo"
      : comboJoin?.name || "Không có combo";
    ordersByCombo[comboName] = (ordersByCombo[comboName] || 0) + 1;
  }

  // Orders by occasion would require a join — for now store empty
  const ordersByOccasion: Record<string, number> = {};

  // Upsert into gift_daily_stats
  const { error } = await supabase.from("gift_daily_stats").upsert(
    {
      stat_date: statDate,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      total_topup: totalTopup,
      new_clients: newClients,
      active_subscriptions: activeSubscriptions,
      orders_by_combo: ordersByCombo,
      orders_by_occasion: ordersByOccasion,
    },
    { onConflict: "stat_date" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stat_date: statDate,
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    total_topup: totalTopup,
    new_clients: newClients,
    active_subscriptions: activeSubscriptions,
  });
}
