import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = request.nextUrl;

  const slug = searchParams.get("slug");
  const occasion = searchParams.get("occasion");

  // Single combo by slug
  if (slug) {
    const { data, error } = await supabase
      .from("gift_combo_tiers")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Không tìm thấy combo" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  }

  // List combos with optional occasion filter
  let query = supabase
    .from("gift_combo_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (occasion) {
    query = query.contains("occasion_types", [occasion]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
