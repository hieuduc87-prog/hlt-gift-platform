import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export async function POST(
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

  const service = createServiceClient();

  // Fetch subscription, verify ownership + status
  const { data: sub, error: subErr } = await service
    .from("gift_subscriptions")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (subErr || !sub) {
    return NextResponse.json(
      { error: "Khong tim thay dang ky" },
      { status: 404 }
    );
  }

  if (sub.status !== "paused") {
    return NextResponse.json(
      { error: "Chi co the tiep tuc dang ky dang tam dung" },
      { status: 400 }
    );
  }

  // Calculate next delivery date from today + frequency days
  const days = FREQUENCY_DAYS[sub.frequency] || 7;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  const nextDeliveryDate = nextDate.toISOString().split("T")[0];

  const { error: updateErr } = await service
    .from("gift_subscriptions")
    .update({
      status: "active",
      paused_at: null,
      next_delivery_date: nextDeliveryDate,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    next_delivery_date: nextDeliveryDate,
  });
}
