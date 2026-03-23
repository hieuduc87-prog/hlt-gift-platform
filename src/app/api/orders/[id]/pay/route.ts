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

  // Use service client for mutations that need to bypass RLS
  const service = createServiceClient();

  // 1. Fetch the order and verify ownership + status
  const { data: order, error: orderErr } = await service
    .from("gift_orders")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng" },
      { status: 404 }
    );
  }

  if (order.status !== "draft") {
    return NextResponse.json(
      { error: "Chỉ có thể thanh toán đơn ở trạng thái nháp" },
      { status: 400 }
    );
  }

  // 2. Get wallet
  const { data: wallet, error: walletErr } = await service
    .from("gift_wallets")
    .select("id, balance")
    .eq("profile_id", user.id)
    .single();

  if (walletErr || !wallet) {
    return NextResponse.json(
      { error: "Không tìm thấy ví" },
      { status: 400 }
    );
  }

  // 3. Charge wallet via RPC
  const { error: chargeErr } = await service.rpc("gift_wallet_charge", {
    p_wallet_id: wallet.id,
    p_amount: order.total,
    p_reference: order.code,
    p_description: `Thanh toán đơn hàng ${order.code}`,
  });

  if (chargeErr) {
    // The RPC raises exception if insufficient balance
    const msg = chargeErr.message?.includes("Số dư không đủ")
      ? "Số dư ví không đủ. Vui lòng nạp thêm tiền."
      : chargeErr.message || "Lỗi thanh toán";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 4. Update order
  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await service
    .from("gift_orders")
    .update({
      status: "pending",
      payment_status: "paid",
      payment_method: "wallet",
      paid_at: now,
    })
    .eq("id", id)
    .select(
      "*, gift_combo_tiers(name, price), gift_recipients(full_name, phone), gift_order_timeline_events(*)"
    )
    .single();

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  // 5. Insert timeline event
  await service.from("gift_order_timeline_events").insert({
    order_id: id,
    status: "pending",
    actor_id: user.id,
    actor_type: "buyer",
    note: "Thanh toán bằng ví HLT",
  });

  // 6. Auto-create gift unwrap token
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let unwrapToken = "";
  for (let i = 0; i < 6; i++) {
    unwrapToken += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  await service.from("gift_unwrap_tokens").insert({
    order_id: id,
    token: unwrapToken,
  });

  // Re-fetch with timeline events to return fresh data
  const { data: final } = await service
    .from("gift_orders")
    .select(
      "*, gift_combo_tiers(name, price), gift_recipients(full_name, phone), gift_order_timeline_events(*)"
    )
    .eq("id", id)
    .single();

  return NextResponse.json(final || updated);
}
