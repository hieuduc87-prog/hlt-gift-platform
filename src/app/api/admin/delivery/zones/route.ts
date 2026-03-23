import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("gift_delivery_zones")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { id, ...updates } = body;
  if (!id) {
    return Response.json({ error: "Thiếu id" }, { status: 400 });
  }

  // Only allow specific fields to be updated
  const allowed: Record<string, unknown> = {};
  if (updates.delivery_fee !== undefined)
    allowed.delivery_fee = Number(updates.delivery_fee);
  if (updates.max_daily_capacity !== undefined)
    allowed.max_daily_capacity = Number(updates.max_daily_capacity);
  if (updates.same_day_cutoff !== undefined)
    allowed.same_day_cutoff = updates.same_day_cutoff;
  if (updates.same_day_available !== undefined)
    allowed.same_day_available = updates.same_day_available;
  if (updates.is_active !== undefined) allowed.is_active = updates.is_active;

  if (Object.keys(allowed).length === 0) {
    return Response.json({ error: "Không có trường nào để cập nhật" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gift_delivery_zones")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
