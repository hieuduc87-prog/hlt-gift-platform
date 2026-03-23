import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const [ordersRes, topupRes, clientsRes] = await Promise.all([
    supabase.from("gift_orders").select("id, total, status").gte("created_at", today),
    supabase.from("gift_transactions").select("amount").eq("type", "topup").gte("created_at", today),
    supabase.from("gift_profiles").select("id", { count: "exact", head: true }),
  ]);

  const todayOrders = ordersRes.data || [];
  const todayTopups = topupRes.data || [];
  const totalClients = clientsRes.count || 0;
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const todayTopupTotal = todayTopups.reduce((s, t) => s + (t.amount || 0), 0);

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

  const message = `📊 <b>HLT Gift Platform - Báo cáo ngày</b>\n\n` +
    `👥 Tổng khách hàng: <b>${totalClients}</b>\n` +
    `📦 Đơn hôm nay: <b>${todayOrders.length}</b>\n` +
    `💰 Doanh thu: <b>${fmt(todayRevenue)}đ</b>\n` +
    `💳 Nạp tiền: <b>${fmt(todayTopupTotal)}đ</b>`;

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message, parse_mode: "HTML" }),
  });

  return NextResponse.json({ sent: true });
}
