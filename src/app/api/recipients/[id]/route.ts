import { createServerSupabase } from "@/lib/supabase/server";
import { recipientSchema } from "@/lib/validations/recipient";
import type { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("gift_recipients")
    .select("*, gift_occasions(*)")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !data) {
    return Response.json(
      { error: "Khong tim thay nguoi nhan" },
      { status: 404 }
    );
  }

  return Response.json(data);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("gift_recipients")
    .select("id")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (!existing) {
    return Response.json(
      { error: "Khong tim thay nguoi nhan" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const parsed = recipientSchema.partial().safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Du lieu khong hop le", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("gift_recipients")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("profile_id", user.id)
    .select("*, gift_occasions(*)")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("gift_recipients")
    .select("id")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (!existing) {
    return Response.json(
      { error: "Khong tim thay nguoi nhan" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("gift_recipients")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
