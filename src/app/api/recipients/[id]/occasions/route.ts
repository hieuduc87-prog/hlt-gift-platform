import { createServerSupabase } from "@/lib/supabase/server";
import { occasionSchema } from "@/lib/validations/recipient";
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

  const { data, error } = await supabase
    .from("gift_occasions")
    .select("*")
    .eq("recipient_id", id)
    .eq("profile_id", user.id)
    .order("date_month", { ascending: true })
    .order("date_day", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
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

  const body = await request.json();
  const parsed = occasionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Du lieu khong hop le", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("gift_occasions")
    .insert({
      ...parsed.data,
      recipient_id: id,
      profile_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
