import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// 1 point = 1 VND
const POINTS_TO_VND = 1;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { points } = body;

  if (!points || typeof points !== "number" || points <= 0) {
    return NextResponse.json({ error: "Số điểm không hợp lệ" }, { status: 400 });
  }

  // Minimum redeem: 10,000 points
  if (points < 10000) {
    return NextResponse.json({ error: "Đổi tối thiểu 10.000 điểm" }, { status: 400 });
  }

  // Get loyalty account
  const { data: account, error: accError } = await supabase
    .from("gift_loyalty_accounts")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (accError || !account) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản tích điểm" }, { status: 404 });
  }

  if (account.points_balance < points) {
    return NextResponse.json({ error: "Không đủ điểm" }, { status: 400 });
  }

  const vndAmount = points * POINTS_TO_VND;

  // Deduct points from loyalty account
  const { error: deductError } = await supabase
    .from("gift_loyalty_accounts")
    .update({
      points_balance: account.points_balance - points,
      points_redeemed_total: account.points_redeemed_total + points,
    })
    .eq("id", account.id);

  if (deductError) {
    return NextResponse.json({ error: deductError.message }, { status: 500 });
  }

  // Log loyalty transaction
  await supabase.from("gift_loyalty_transactions").insert({
    loyalty_account_id: account.id,
    type: "redeem",
    points: -points,
    description: `Đổi ${points.toLocaleString("vi-VN")} điểm thành ${vndAmount.toLocaleString("vi-VN")}đ vào ví`,
  });

  // Credit wallet
  const { data: wallet } = await supabase
    .from("gift_wallets")
    .select("id, balance")
    .eq("profile_id", user.id)
    .single();

  if (wallet) {
    const newBalance = Number(wallet.balance) + vndAmount;
    await supabase
      .from("gift_wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    // Log wallet transaction
    await supabase.from("gift_transactions").insert({
      wallet_id: wallet.id,
      type: "bonus",
      amount: vndAmount,
      balance_after: newBalance,
      description: `Đổi ${points.toLocaleString("vi-VN")} điểm tích lũy`,
    });
  }

  return NextResponse.json({
    success: true,
    points_deducted: points,
    vnd_credited: vndAmount,
    new_points_balance: account.points_balance - points,
  });
}
