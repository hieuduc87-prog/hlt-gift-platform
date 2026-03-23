import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const params = req.nextUrl.searchParams;

  const offset = Number(params.get("offset") || "0");
  const limit = Math.min(Number(params.get("limit") || "50"), 100);
  const type = params.get("type");
  const from = params.get("from");
  const to = params.get("to");

  let query = supabase
    .from("gift_transactions")
    .select("*, gift_wallets(gift_profiles(full_name))")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  if (from) {
    query = query.gte("created_at", `${from}T00:00:00`);
  }

  if (to) {
    query = query.lte("created_at", `${to}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}
