import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Allowed fields for admin PATCH
const ALLOWED_FIELDS = [
  "internal_note",
  "delivery_address",
  "delivery_date",
  "delivery_time",
  "assigned_staff_id",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Filter to only allowed fields
  const updatePayload: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      updatePayload[key] = body[key];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Không có trường nào được cập nhật" },
      { status: 400 }
    );
  }

  updatePayload.updated_at = new Date().toISOString();

  const supabase = createServiceClient();

  // Check existence
  const { data: existing, error: fetchError } = await supabase
    .from("gift_orders")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng" },
      { status: 404 }
    );
  }

  // Update
  const { data: updated, error: updateError } = await supabase
    .from("gift_orders")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ order: updated });
}
