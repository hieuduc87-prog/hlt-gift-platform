import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get cards for user's orders
  const { data: orders } = await supabase
    .from("gift_orders")
    .select("id")
    .eq("profile_id", user.id);

  const orderIds = (orders || []).map((o) => o.id);

  if (orderIds.length === 0) {
    return Response.json([]);
  }

  const { data: cards } = await supabase
    .from("gift_cards")
    .select("*, gift_orders(code, recipient_name, status)")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false });

  return Response.json(cards || []);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { order_id, template_id, message } = body;

  if (!order_id || !message) {
    return Response.json(
      { error: "Missing order_id or message" },
      { status: 400 }
    );
  }

  // Verify order belongs to user
  const { data: order } = await supabase
    .from("gift_orders")
    .select("id")
    .eq("id", order_id)
    .eq("profile_id", user.id)
    .single();

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: card, error } = await supabase
    .from("gift_cards")
    .insert({
      order_id,
      template_id: template_id || null,
      message,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Also update card_message on the order
  await supabase
    .from("gift_orders")
    .update({ card_message: message, card_template_id: template_id || null })
    .eq("id", order_id);

  return Response.json(card, { status: 201 });
}
