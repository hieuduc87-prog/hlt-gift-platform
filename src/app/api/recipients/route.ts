import { createServerSupabase } from "@/lib/supabase/server";
import { recipientSchema } from "@/lib/validations/recipient";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabase
    .from("gift_recipients")
    .select("*, gift_occasions(*)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = recipientSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Du lieu khong hop le", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("gift_recipients")
    .insert({
      ...parsed.data,
      profile_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
