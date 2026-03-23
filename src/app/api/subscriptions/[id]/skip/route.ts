import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

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
    return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = body.reason || null;

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

  if (sub.status !== "active") {
    return NextResponse.json(
      { error: "Chi co the bo qua dang ky dang hoat dong" },
      { status: 400 }
    );
  }

  // Create a skipped delivery record
  await service.from("gift_subscription_deliveries").insert({
    subscription_id: id,
    scheduled_date: sub.next_delivery_date,
    status: "skipped",
    skip_reason: reason,
  });

  // Calculate next delivery date
  const days = FREQUENCY_DAYS[sub.frequency] || 7;
  const currentDate = new Date(sub.next_delivery_date);
  currentDate.setDate(currentDate.getDate() + days);
  const nextDeliveryDate = currentDate.toISOString().split("T")[0];

  // Update subscription
  const { error: updateErr } = await service
    .from("gift_subscriptions")
    .update({
      next_delivery_date: nextDeliveryDate,
      skipped_count: sub.skipped_count + 1,
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
