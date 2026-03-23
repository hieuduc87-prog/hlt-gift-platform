import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const TOPUP_PATTERN = /GIFT[A-Z0-9]{4}\d{6}/i;

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verify webhook secret if configured
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const content = body.transaction_content || body.body || "";
  const amountIn = body.amount_in || 0;

  if (!amountIn || amountIn <= 0) {
    return NextResponse.json({ status: "ignored", reason: "no_amount" });
  }

  // Match GIFT topup code
  const match = content.match(TOPUP_PATTERN);
  if (!match) {
    return NextResponse.json({ status: "ignored", reason: "no_gift_code" });
  }

  const topupCode = match[0].toUpperCase();
  const shortId = topupCode.slice(4, 8).toLowerCase();

  const supabase = createServiceClient();

  // Find wallet by profile ID prefix
  const { data: profiles } = await supabase
    .from("gift_profiles")
    .select("id")
    .limit(100);

  if (!profiles) {
    return NextResponse.json(
      { error: "No profiles found" },
      { status: 404 }
    );
  }

  // Match by first 4 chars of UUID
  const matchedProfile = profiles.find(
    (p) => p.id.slice(0, 4).toUpperCase() === shortId.toUpperCase()
  );

  if (!matchedProfile) {
    return NextResponse.json(
      { error: "Profile not found for code: " + topupCode },
      { status: 404 }
    );
  }

  // Get wallet
  const { data: wallet } = await supabase
    .from("gift_wallets")
    .select("id")
    .eq("profile_id", matchedProfile.id)
    .single();

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  // Check idempotency — skip if already processed
  const { data: existing } = await supabase
    .from("gift_transactions")
    .select("id")
    .eq("reference", body.reference_number || topupCode)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ status: "already_processed" });
  }

  // Atomic topup via RPC
  const { data: newBalance, error } = await supabase.rpc("gift_wallet_topup", {
    p_wallet_id: wallet.id,
    p_amount: amountIn,
    p_reference: body.reference_number || topupCode,
    p_description: `Nạp tiền qua chuyển khoản: ${topupCode}`,
    p_metadata: {
      sepay_id: body.id,
      gateway: body.gateway,
      transaction_date: body.transaction_date,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: "success",
    topup_code: topupCode,
    amount: amountIn,
    new_balance: newBalance,
  });
}
