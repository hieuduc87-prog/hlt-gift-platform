import { createServiceClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();

  const { amount, description } = body;

  if (amount == null || amount === 0) {
    return Response.json(
      { error: "Số tiền không hợp lệ" },
      { status: 400 }
    );
  }

  if (!description || description.trim().length === 0) {
    return Response.json(
      { error: "Vui lòng nhập lý do điều chỉnh" },
      { status: 400 }
    );
  }

  // Get current wallet
  const { data: wallet, error: walletError } = await supabase
    .from("gift_wallets")
    .select("*")
    .eq("profile_id", id)
    .single();

  if (walletError || !wallet) {
    return Response.json(
      { error: "Không tìm thấy ví của khách hàng" },
      { status: 404 }
    );
  }

  const numAmount = Number(amount);
  const newBalance = Number(wallet.balance) + numAmount;

  if (newBalance < 0) {
    return Response.json(
      { error: "Số dư ví không đủ để trừ" },
      { status: 400 }
    );
  }

  // Update wallet balance
  const walletUpdate: Record<string, unknown> = {
    balance: newBalance,
    updated_at: new Date().toISOString(),
  };

  // If adding money, also increase total_topup
  if (numAmount > 0) {
    walletUpdate.total_topup = Number(wallet.total_topup) + numAmount;
  } else {
    walletUpdate.total_spent = Number(wallet.total_spent) + Math.abs(numAmount);
  }

  const { error: updateError } = await supabase
    .from("gift_wallets")
    .update(walletUpdate)
    .eq("id", wallet.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  // Insert transaction record
  const { error: txError } = await supabase
    .from("gift_transactions")
    .insert({
      wallet_id: wallet.id,
      type: "adjustment",
      amount: numAmount,
      balance_after: newBalance,
      description: description.trim(),
      metadata: { admin_adjustment: true },
    });

  if (txError) {
    return Response.json({ error: txError.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    new_balance: newBalance,
  });
}
