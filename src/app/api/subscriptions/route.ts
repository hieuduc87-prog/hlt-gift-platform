import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const COMMITMENT_DISCOUNTS: Record<number, number> = {
  0: 0,
  3: 5,
  6: 10,
  12: 15,
};

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("gift_subscriptions")
    .select("*, gift_recipients(full_name), gift_combo_tiers(name, price)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const body = await request.json();
  const {
    recipient_id,
    combo_tier_id,
    frequency,
    first_delivery_date,
    delivery_time,
    delivery_address,
    delivery_district,
    delivery_city,
    card_message,
    commitment_months,
  } = body;

  // Validate required fields
  if (!recipient_id || !combo_tier_id || !frequency || !first_delivery_date) {
    return NextResponse.json(
      { error: "Thieu thong tin bat buoc" },
      { status: 400 }
    );
  }

  // Validate frequency
  if (!["weekly", "biweekly", "monthly"].includes(frequency)) {
    return NextResponse.json(
      { error: "Tan suat khong hop le" },
      { status: 400 }
    );
  }

  // Validate commitment months
  const months = commitment_months || 0;
  const discount = COMMITMENT_DISCOUNTS[months] ?? 0;

  const service = createServiceClient();

  // Verify recipient belongs to user
  const { data: recipient, error: recErr } = await service
    .from("gift_recipients")
    .select("id")
    .eq("id", recipient_id)
    .eq("profile_id", user.id)
    .single();

  if (recErr || !recipient) {
    return NextResponse.json(
      { error: "Nguoi nhan khong hop le" },
      { status: 400 }
    );
  }

  // Verify combo exists and is active
  const { data: combo, error: comboErr } = await service
    .from("gift_combo_tiers")
    .select("id")
    .eq("id", combo_tier_id)
    .eq("is_active", true)
    .single();

  if (comboErr || !combo) {
    return NextResponse.json(
      { error: "Combo khong hop le" },
      { status: 400 }
    );
  }

  // Create subscription
  const { data: subscription, error: insertErr } = await service
    .from("gift_subscriptions")
    .insert({
      profile_id: user.id,
      recipient_id,
      combo_tier_id,
      frequency,
      status: "active",
      delivery_address: delivery_address || null,
      delivery_district: delivery_district || null,
      delivery_city: delivery_city || "HCM",
      delivery_time: delivery_time || "09:00-12:00",
      card_message: card_message || null,
      next_delivery_date: first_delivery_date,
      commitment_months: months,
      discount_percent: discount,
      total_deliveries: 0,
      skipped_count: 0,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json(subscription, { status: 201 });
}
