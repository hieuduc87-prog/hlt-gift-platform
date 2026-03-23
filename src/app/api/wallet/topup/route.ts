import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const amount = body.amount;

  if (!amount || amount < 100000) {
    return NextResponse.json(
      { error: "Số tiền tối thiểu 100.000đ" },
      { status: 400 }
    );
  }

  // Generate topup code
  const shortId = user.id.slice(0, 4).toUpperCase();
  const dateStr = new Date()
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, "");
  const topupCode = `GIFT${shortId}${dateStr}`;

  // Build VietQR URL
  const bankId = process.env.BANK_ID || "970407";
  const accountNo = process.env.BANK_ACCOUNT_NO || "";
  const accountName = process.env.BANK_ACCOUNT_NAME || "HOA LANG THANG";

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${amount}&addInfo=${topupCode}&accountName=${encodeURIComponent(accountName)}`;

  return NextResponse.json({
    topup_code: topupCode,
    amount,
    qr_url: qrUrl,
    bank_id: bankId,
    account_no: accountNo,
    account_name: accountName,
    transfer_content: topupCode,
  });
}
