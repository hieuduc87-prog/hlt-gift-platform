import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("gift_delivery_staff")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { name, phone, max_daily_orders } = body;
  if (!name || !phone) {
    return Response.json(
      { error: "Thiếu thông tin bắt buộc: name, phone" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("gift_delivery_staff")
    .insert({
      name,
      phone,
      max_daily_orders: max_daily_orders ?? 10,
      is_active: true,
      assigned_zones: [],
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { id, ...updates } = body;
  if (!id) {
    return Response.json({ error: "Thiếu id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gift_delivery_staff")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
