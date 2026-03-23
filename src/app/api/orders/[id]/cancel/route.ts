import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
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

  const body = await request.json().catch(() => ({}));
  const reason = body.reason || null;

  const service = createServiceClient();

  // 1. Fetch order, verify ownership + status
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

  if (order.status !== "draft" && order.status !== "pending") {
    return NextResponse.json(
      { error: "Chỉ có thể hủy đơn ở trạng thái nháp hoặc chờ xác nhận" },
      { status: 400 }
    );
  }

  // 2. If already paid, refund to wallet
  if (order.payment_status === "paid") {
    const { data: wallet } = await service
      .from("gift_wallets")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (wallet) {
      const { error: refundErr } = await service.rpc("gift_wallet_refund", {
        p_wallet_id: wallet.id,
        p_amount: order.total,
        p_reference: order.code,
        p_description: `Hoàn tiền đơn hàng ${order.code}`,
      });

      if (refundErr) {
        return NextResponse.json(
          { error: "Lỗi hoàn tiền: " + refundErr.message },
          { status: 500 }
        );
      }
    }
  }

  // 3. Update order
  const now = new Date().toISOString();
  const { error: updateErr } = await service
    .from("gift_orders")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancel_reason: reason,
      payment_status: order.payment_status === "paid" ? "refunded" : order.payment_status,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  // 4. Insert timeline event
  await service.from("gift_order_timeline_events").insert({
    order_id: id,
    status: "cancelled",
    actor_id: user.id,
    actor_type: "buyer",
    note: reason
      ? `Hủy bởi khách hàng: ${reason}`
      : "Hủy bởi khách hàng",
  });

  return NextResponse.json({ success: true });
}
