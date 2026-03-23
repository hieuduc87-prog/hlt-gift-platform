import { createServiceClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();

  // Check if combo exists
  const { data: existing } = await supabase
    .from("gift_combo_tiers")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) {
    return Response.json(
      { error: "Không tìm thấy combo" },
      { status: 404 }
    );
  }

  // If slug changed, check uniqueness
  if (body.slug) {
    const { data: slugExists } = await supabase
      .from("gift_combo_tiers")
      .select("id")
      .eq("slug", body.slug)
      .neq("id", id)
      .single();

    if (slugExists) {
      return Response.json(
        { error: "Slug đã tồn tại, vui lòng chọn slug khác" },
        { status: 409 }
      );
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Only set provided fields
  if (body.name !== undefined) updateData.name = body.name;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price !== undefined) updateData.price = Number(body.price);
  if (body.includes !== undefined) updateData.includes = body.includes;
  if (body.occasion_types !== undefined) updateData.occasion_types = body.occasion_types;
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  const { data, error } = await supabase
    .from("gift_combo_tiers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Soft-delete: set is_active = false
  const { data, error } = await supabase
    .from("gift_combo_tiers")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json(
      { error: "Không tìm thấy combo" },
      { status: 404 }
    );
  }

  return Response.json({ success: true });
}
