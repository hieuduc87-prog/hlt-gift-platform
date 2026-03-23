import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to get existing loyalty account
  let { data: account } = await supabase
    .from("gift_loyalty_accounts")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  // Auto-create if not exists
  if (!account) {
    const { data: newAccount, error: createError } = await supabase
      .from("gift_loyalty_accounts")
      .insert({ profile_id: user.id, tier: "silver", points_balance: 0, points_earned_total: 0, points_redeemed_total: 0, lifetime_spend: 0 })
      .select("*")
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    account = newAccount;
  }

  // Fetch recent transactions
  const { data: transactions } = await supabase
    .from("gift_loyalty_transactions")
    .select("*")
    .eq("loyalty_account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    account,
    transactions: transactions || [],
  });
}
