import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // 1. Fetch original order
  const { data: original, error: fetchErr } = await service
    .from("gift_orders")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (fetchErr || !original) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng gốc" },
      { status: 404 }
    );
  }

  // 2. Generate new order code
  const code = `GIFT-${new Date()
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, "")}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  // 3. Clone order with fresh status
  const { data: newOrder, error: insertErr } = await service
    .from("gift_orders")
    .insert({
      code,
      profile_id: user.id,
      recipient_id: original.recipient_id,
      occasion_id: original.occasion_id,
      combo_tier_id: original.combo_tier_id,
      recipient_name: original.recipient_name,
      recipient_phone: original.recipient_phone,
      delivery_address: original.delivery_address,
      delivery_district: original.delivery_district,
      delivery_city: original.delivery_city,
      delivery_time: original.delivery_time,
      delivery_note: original.delivery_note,
      card_message: original.card_message,
      card_template_id: original.card_template_id,
      subtotal: original.subtotal,
      delivery_fee: original.delivery_fee,
      discount: 0,
      total: original.subtotal + (original.delivery_fee || 0),
      status: "draft",
      payment_status: "unpaid",
    })
    .select("id, code")
    .single();

  if (insertErr || !newOrder) {
    return NextResponse.json(
      { error: insertErr?.message || "Không thể tạo đơn mới" },
      { status: 500 }
    );
  }

  // 4. Insert timeline event for new order
  await service.from("gift_order_timeline_events").insert({
    order_id: newOrder.id,
    status: "draft",
    actor_id: user.id,
    actor_type: "buyer",
    note: `Đặt lại từ đơn ${original.code}`,
  });

  return NextResponse.json({ id: newOrder.id, code: newOrder.code });
}
