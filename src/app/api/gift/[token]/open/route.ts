import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const service = createServiceClient();

  // Find the unwrap token
  const { data: tokenRow, error } = await service
    .from("gift_unwrap_tokens")
    .select("id, recipient_viewed_at")
    .eq("token", token)
    .single();

  if (error || !tokenRow) {
    return NextResponse.json(
      { error: "Token kh\u00f4ng h\u1ee3p l\u1ec7" },
      { status: 404 }
    );
  }

  // Only update viewed_at if not already set
  if (!tokenRow.recipient_viewed_at) {
    await service
      .from("gift_unwrap_tokens")
      .update({ recipient_viewed_at: new Date().toISOString() })
      .eq("id", tokenRow.id);
  }

  // Insert unwrap event
  await service.from("gift_unwrap_events").insert({
    token_id: tokenRow.id,
    event_type: "opened",
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
