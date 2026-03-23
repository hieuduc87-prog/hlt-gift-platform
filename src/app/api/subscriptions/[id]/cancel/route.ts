import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
    .select("id, status, profile_id")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (subErr || !sub) {
    return NextResponse.json(
      { error: "Khong tim thay dang ky" },
      { status: 404 }
    );
  }

  if (sub.status === "cancelled") {
    return NextResponse.json(
      { error: "Dang ky da duoc huy truoc do" },
      { status: 400 }
    );
  }

  if (sub.status === "expired") {
    return NextResponse.json(
      { error: "Dang ky da het han" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await service
    .from("gift_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: now,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, cancelled_at: now });
}
