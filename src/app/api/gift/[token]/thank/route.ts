import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body kh\u00f4ng h\u1ee3p l\u1ec7" },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message || message.length === 0) {
    return NextResponse.json(
      { error: "Vui l\u00f2ng nh\u1eadp l\u1eddi c\u1ea3m \u01a1n" },
      { status: 400 }
    );
  }

  if (message.length > 500) {
    return NextResponse.json(
      { error: "L\u1eddi c\u1ea3m \u01a1n t\u1ed1i \u0111a 500 k\u00fd t\u1ef1" },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Find the unwrap token
  const { data: tokenRow, error } = await service
    .from("gift_unwrap_tokens")
    .select("id")
    .eq("token", token)
    .single();

  if (error || !tokenRow) {
    return NextResponse.json(
      { error: "Token kh\u00f4ng h\u1ee3p l\u1ec7" },
      { status: 404 }
    );
  }

  // Update recipient_response
  await service
    .from("gift_unwrap_tokens")
    .update({ recipient_response: message })
    .eq("id", tokenRow.id);

  // Insert unwrap event
  await service.from("gift_unwrap_events").insert({
    token_id: tokenRow.id,
    event_type: "thanked",
    metadata: { message },
  });

  return NextResponse.json({ ok: true });
}
