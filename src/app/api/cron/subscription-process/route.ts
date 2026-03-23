import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find active subscriptions where next_delivery_date <= today + 3 days
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  const targetDateStr = targetDate.toISOString().split("T")[0];

  const { data: subscriptions, error: fetchErr } = await supabase
    .from("gift_subscriptions")
    .select(
      "*, gift_recipients(full_name, phone, address, district, city), gift_combo_tiers(name, price)"
    )
    .eq("status", "active")
    .lte("next_delivery_date", targetDateStr);

  if (fetchErr) {
    return NextResponse.json(
      { error: fetchErr.message },
      { status: 500 }
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ processed: 0, message: "No subscriptions due" });
  }

  let processed = 0;
  let errors = 0;
  const results: { subscription_id: string; success: boolean; error?: string }[] = [];

  for (const sub of subscriptions) {
    try {
      const combo = sub.gift_combo_tiers;
      const recipient = sub.gift_recipients;

      if (!combo || !recipient) {
        results.push({
          subscription_id: sub.id,
          success: false,
          error: "Missing combo or recipient data",
        });
        errors++;
        continue;
      }

      // Calculate discounted price
      const discountedPrice = sub.discount_percent
        ? Math.round(combo.price * (1 - sub.discount_percent / 100))
        : combo.price;

      // Generate order code
      const code = `GIFT-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-SUB-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

      // 1. Create a gift_order
      const { data: order, error: orderErr } = await supabase
        .from("gift_orders")
        .insert({
          code,
          profile_id: sub.profile_id,
          recipient_id: sub.recipient_id,
          combo_tier_id: sub.combo_tier_id,
          recipient_name: recipient.full_name,
          recipient_phone: recipient.phone,
          delivery_address: sub.delivery_address || recipient.address,
          delivery_district: sub.delivery_district || recipient.district,
          delivery_city: sub.delivery_city || recipient.city,
          delivery_date: sub.next_delivery_date,
          delivery_time: sub.delivery_time,
          card_message: sub.card_message,
          subtotal: combo.price,
          discount: combo.price - discountedPrice,
          total: discountedPrice,
          status: "draft",
          payment_method: "wallet",
          note: `Tu dong tao tu dang ky dinh ky`,
        })
        .select("id")
        .single();

      if (orderErr || !order) {
        results.push({
          subscription_id: sub.id,
          success: false,
          error: `Order creation failed: ${orderErr?.message || "Unknown"}`,
        });
        errors++;
        continue;
      }

      // 2. Try to charge wallet
      const { data: wallet } = await supabase
        .from("gift_wallets")
        .select("id")
        .eq("profile_id", sub.profile_id)
        .single();

      if (wallet) {
        const { error: chargeErr } = await supabase.rpc("gift_wallet_charge", {
          p_wallet_id: wallet.id,
          p_amount: discountedPrice,
          p_reference: code,
          p_description: `Thanh toan dang ky dinh ky - ${combo.name}`,
        });

        if (!chargeErr) {
          // Payment successful - update order to pending
          await supabase
            .from("gift_orders")
            .update({
              status: "pending",
              payment_status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }
        // If charge fails, order stays as draft (insufficient funds)
      }

      // 3. Create delivery record
      await supabase.from("gift_subscription_deliveries").insert({
        subscription_id: sub.id,
        order_id: order.id,
        scheduled_date: sub.next_delivery_date,
        status: "scheduled",
      });

      // 4. Advance next_delivery_date
      const days = FREQUENCY_DAYS[sub.frequency] || 7;
      const currentDate = new Date(sub.next_delivery_date);
      currentDate.setDate(currentDate.getDate() + days);
      const nextDeliveryDate = currentDate.toISOString().split("T")[0];

      await supabase
        .from("gift_subscriptions")
        .update({
          next_delivery_date: nextDeliveryDate,
          total_deliveries: sub.total_deliveries + 1,
        })
        .eq("id", sub.id);

      processed++;
      results.push({ subscription_id: sub.id, success: true });
    } catch (err) {
      errors++;
      results.push({
        subscription_id: sub.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Send Telegram notification if configured
  if (
    process.env.TELEGRAM_BOT_TOKEN &&
    process.env.TELEGRAM_CHAT_ID &&
    processed > 0
  ) {
    const message = `HLT Gift - Subscription Cron\n\nDa xu ly: ${processed} dang ky\nLoi: ${errors}\nTong: ${subscriptions.length}`;

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
        }),
      }
    ).catch(console.error);
  }

  return NextResponse.json({
    processed,
    errors,
    total: subscriptions.length,
    results,
  });
}
