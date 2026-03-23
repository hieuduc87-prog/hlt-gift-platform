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

  if (sub.status !== "active") {
    return NextResponse.json(
      { error: "Chi co the tam dung dang ky dang hoat dong" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await service
    .from("gift_subscriptions")
    .update({
      status: "paused",
      paused_at: now,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, paused_at: now });
}
