import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("gift_subscriptions")
    .select(
      "*, gift_recipients(full_name, phone), gift_combo_tiers(name, price), gift_subscription_deliveries(*)"
    )
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Khong tim thay dang ky" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const body = await request.json();
  const service = createServiceClient();

  // Verify ownership
  const { data: existing } = await service
    .from("gift_subscriptions")
    .select("id, status")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "Khong tim thay dang ky" },
      { status: 404 }
    );
  }

  // Only allow updates to certain fields
  const allowedFields = [
    "delivery_address",
    "delivery_district",
    "delivery_city",
    "delivery_time",
    "card_message",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Khong co truong nao de cap nhat" },
      { status: 400 }
    );
  }

  const { data: updated, error: updateErr } = await service
    .from("gift_subscriptions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}
