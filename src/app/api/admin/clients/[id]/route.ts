import { createServiceClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch profile with wallet, orders count, recipients count
  const [profileRes, walletRes, ordersRes, recipientsRes] = await Promise.all([
    supabase
      .from("gift_profiles")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("gift_wallets")
      .select("*")
      .eq("profile_id", id)
      .single(),
    supabase
      .from("gift_orders")
      .select("*")
      .eq("profile_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("gift_recipients")
      .select("*, gift_occasions(id)")
      .eq("profile_id", id)
      .order("full_name", { ascending: true }),
  ]);

  if (profileRes.error || !profileRes.data) {
    return Response.json(
      { error: "Không tìm thấy khách hàng" },
      { status: 404 }
    );
  }

  return Response.json({
    profile: profileRes.data,
    wallet: walletRes.data || null,
    orders: ordersRes.data || [],
    recipients: recipientsRes.data || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.admin_notes !== undefined) updateData.admin_notes = body.admin_notes;
  if (body.role !== undefined) updateData.role = body.role;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  const { data, error } = await supabase
    .from("gift_profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json(
      { error: "Không tìm thấy khách hàng" },
      { status: 404 }
    );
  }

  return Response.json(data);
}
