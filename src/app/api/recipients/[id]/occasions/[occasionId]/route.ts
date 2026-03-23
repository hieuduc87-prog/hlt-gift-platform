import { createServerSupabase } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string; occasionId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id, occasionId } = await ctx.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  // Verify recipient ownership
  const { data: recipient } = await supabase
    .from("gift_recipients")
    .select("id")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (!recipient) {
    return Response.json(
      { error: "Khong tim thay nguoi nhan" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("gift_occasions")
    .delete()
    .eq("id", occasionId)
    .eq("recipient_id", id)
    .eq("profile_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
