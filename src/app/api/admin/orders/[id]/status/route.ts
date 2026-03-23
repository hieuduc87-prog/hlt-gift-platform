import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { GiftOrderStatus } from "@/types";

const VALID_STATUSES: GiftOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "delivering",
  "delivered",
  "cancelled",
];

// Map status → timestamp field to set
const STATUS_TIMESTAMP_MAP: Partial<Record<GiftOrderStatus, string>> = {
  confirmed: "confirmed_at",
  delivered: "delivered_at",
  cancelled: "cancelled_at",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { status: GiftOrderStatus; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { status, note } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Trạng thái không hợp lệ" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Fetch current order
  const { data: existing, error: fetchError } = await supabase
    .from("gift_orders")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng" },
      { status: 404 }
    );
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Set corresponding timestamp
  const tsField = STATUS_TIMESTAMP_MAP[status];
  if (tsField) {
    updatePayload[tsField] = new Date().toISOString();
  }

  // If cancelling, store cancel reason
  if (status === "cancelled" && note) {
    updatePayload.cancel_reason = note;
  }

  // Update order
  const { error: updateError } = await supabase
    .from("gift_orders")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // Insert timeline event
  await supabase.from("gift_order_timeline_events").insert({
    order_id: id,
    status,
    actor_type: "admin",
    note: note || null,
    metadata: {},
  });

  // Re-fetch with full joins
  const { data: updated } = await supabase
    .from("gift_orders")
    .select(
      `
      *,
      gift_profiles(full_name, phone, email),
      gift_combo_tiers(name, price),
      gift_recipients(full_name, phone, address),
      gift_order_timeline_events(*)
    `
    )
    .eq("id", id)
    .single();

  if (updated?.gift_order_timeline_events) {
    updated.gift_order_timeline_events.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return NextResponse.json({ order: updated });
}
