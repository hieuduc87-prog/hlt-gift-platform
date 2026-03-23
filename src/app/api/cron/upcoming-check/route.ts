import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get all occasions
  const { data: occasions } = await supabase
    .from("gift_occasions")
    .select("*, gift_recipients(full_name, profile_id)");

  const now = new Date();
  const reminders: { occasion_id: string; recipient_name: string; profile_id: string; days_until: number }[] = [];

  for (const occ of occasions || []) {
    // Calculate next occurrence date
    const nextDate = new Date(now.getFullYear(), occ.date_month - 1, occ.date_day);
    if (nextDate < now) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= (occ.remind_days_before || 7) && diffDays >= 0) {
      reminders.push({
        occasion_id: occ.id,
        recipient_name: occ.gift_recipients?.full_name || "Unknown",
        profile_id: occ.gift_recipients?.profile_id || "",
        days_until: diffDays,
      });
    }
  }

  // Log notifications
  if (reminders.length > 0) {
    const logs = reminders.map((r) => ({
      profile_id: r.profile_id,
      channel: "system",
      type: "occasion_reminder",
      payload: { occasion_id: r.occasion_id, recipient_name: r.recipient_name, days_until: r.days_until },
      status: "sent",
    }));

    await supabase.from("gift_notification_log").insert(logs);
  }

  // Send Telegram digest to admin
  if (reminders.length > 0 && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const message = `🎁 HLT Gift Platform - Nhắc nhở\n\n${reminders.length} dịp sắp tới:\n${reminders.map((r) => `• ${r.recipient_name} - còn ${r.days_until} ngày`).join("\n")}`;

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message, parse_mode: "HTML" }),
    }).catch(console.error);
  }

  return NextResponse.json({ reminders: reminders.length, checked: (occasions || []).length });
}
