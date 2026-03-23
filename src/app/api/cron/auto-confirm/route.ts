import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find pending orders older than 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingOrders } = await supabase
    .from("gift_orders")
    .select("id, code, profile_id, total")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  let confirmed = 0;
  let failed = 0;

  for (const order of pendingOrders || []) {
    // Try to charge wallet
    const { data: wallet } = await supabase
      .from("gift_wallets")
      .select("id, balance")
      .eq("profile_id", order.profile_id)
      .single();

    if (!wallet || wallet.balance < order.total) {
      failed++;
      continue;
    }

    // Charge wallet atomically
    const { error: chargeError } = await supabase.rpc("gift_wallet_charge", {
      p_wallet_id: wallet.id,
      p_amount: order.total,
      p_reference: order.code,
      p_description: `Thanh toán đơn ${order.code}`,
    });

    if (chargeError) {
      failed++;
      continue;
    }

    // Update order status
    await supabase
      .from("gift_orders")
      .update({
        status: "confirmed",
        payment_status: "paid",
      })
      .eq("id", order.id);

    confirmed++;
  }

  return NextResponse.json({ confirmed, failed, total: (pendingOrders || []).length });
}
