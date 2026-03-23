import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("gift_combo_tiers")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  // Validate required fields
  const { name, slug, price } = body;
  if (!name || !slug || price == null) {
    return Response.json(
      { error: "Thiếu thông tin bắt buộc: name, slug, price" },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("gift_combo_tiers")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return Response.json(
      { error: "Slug đã tồn tại, vui lòng chọn slug khác" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("gift_combo_tiers")
    .insert({
      name,
      slug,
      description: body.description || null,
      price: Number(price),
      includes: body.includes || [],
      occasion_types: body.occasion_types || [],
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
