import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUpcomingOccasions } from "@/lib/calendar-engine";
import { formatPrice, formatDateShort, formatRelativeDate } from "@/lib/formatters";
import { OCCASION_CONFIG, RELATIONSHIP_CONFIG } from "@/types";
import type { GiftRecipient, GiftOccasion } from "@/types";
import Link from "next/link";
import { Users, CalendarDays, Gift, Wallet, Plus, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch data in parallel
  const [profileRes, walletRes, recipientsRes, occasionsRes, ordersRes] = await Promise.all([
    supabase.from("gift_profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("gift_wallets").select("balance").eq("profile_id", user.id).single(),
    supabase.from("gift_recipients").select("*").eq("profile_id", user.id),
    supabase.from("gift_occasions").select("*").eq("profile_id", user.id),
    supabase.from("gift_orders").select("id, status").eq("profile_id", user.id),
  ]);

  const name = profileRes.data?.full_name || "Bạn";
  const balance = Number(walletRes.data?.balance || 0);
  const recipients = (recipientsRes.data || []) as GiftRecipient[];
  const occasions = (occasionsRes.data || []) as GiftOccasion[];

  // Calendar engine
  const recipientMap = new Map(recipients.map((r) => [r.id, r]));
  const upcoming = getUpcomingOccasions(occasions, recipientMap, 30);
  const upcoming7 = upcoming.filter((u) => u.days_until <= 7);

  const deliveredThisMonth = (ordersRes.data || []).filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-display text-foreground">
          Xin chào, {name}
        </h1>
        <p className="mt-1 text-text-secondary">
          Hãy để Hoa Lang Thang lo chuyện tặng quà
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Người nhận"
          value={recipients.length.toString()}
          href="/hoadinhky/recipients"
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Sắp tới 7 ngày"
          value={upcoming7.length.toString()}
          highlight={upcoming7.length > 0}
        />
        <StatCard
          icon={<Gift size={20} />}
          label="Đã giao tháng này"
          value={deliveredThisMonth.toString()}
        />
        <StatCard
          icon={<Wallet size={20} />}
          label="Số dư"
          value={formatPrice(balance)}
          href="/hoadinhky/wallet"
          gold
        />
      </div>

      {/* Urgent */}
      {upcoming7.length > 0 && (
        <div className="bg-warning-bg border border-warning/20 rounded-xl p-4">
          <h3 className="font-semibold text-warning mb-2">
            Có {upcoming7.length} dịp trong 7 ngày tới
          </h3>
          <div className="space-y-2">
            {upcoming7.map((u) => (
              <div key={u.occasion.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {OCCASION_CONFIG[u.occasion.type]?.icon} {u.recipient.full_name} — {OCCASION_CONFIG[u.occasion.type]?.label}
                </span>
                <span className="text-warning font-medium">
                  {formatRelativeDate(u.next_date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/hoadinhky/recipients/new"
          className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl hover:border-gold/30 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-gold-bg flex items-center justify-center text-gold">
            <Plus size={20} />
          </div>
          <div>
            <p className="font-medium text-foreground">Thêm người nhận</p>
            <p className="text-sm text-text-muted">Thêm người bạn muốn tặng quà</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-text-muted group-hover:text-gold transition-colors" />
        </Link>
        <Link
          href="/hoadinhky/wallet"
          className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl hover:border-gold/30 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-gold-bg flex items-center justify-center text-gold">
            <Wallet size={20} />
          </div>
          <div>
            <p className="font-medium text-foreground">Nạp tiền</p>
            <p className="text-sm text-text-muted">Nạp tiền vào ví để đặt quà</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-text-muted group-hover:text-gold transition-colors" />
        </Link>
      </div>

      {/* Upcoming occasions */}
      <div>
        <h2 className="text-lg font-display text-foreground mb-4">
          Sắp tới (30 ngày)
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <CalendarDays size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary">Chưa có dịp nào sắp tới</p>
            <p className="text-sm text-text-muted mt-1">
              Thêm người nhận và dịp tặng quà để bắt đầu
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((u) => (
              <div
                key={u.occasion.id}
                className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-gold-bg flex items-center justify-center text-lg">
                  {OCCASION_CONFIG[u.occasion.type]?.icon || "🎁"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {u.recipient.full_name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {OCCASION_CONFIG[u.occasion.type]?.label}
                    {u.occasion.label ? ` — ${u.occasion.label}` : ""} ·{" "}
                    {formatDateShort(u.next_date)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      u.days_until <= 3
                        ? "text-error"
                        : u.days_until <= 7
                          ? "text-warning"
                          : "text-text-secondary"
                    }`}
                  >
                    {formatRelativeDate(u.next_date)}
                  </span>
                  <p className="text-xs text-text-muted">
                    {RELATIONSHIP_CONFIG[u.recipient.relationship]?.label || ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  highlight,
  gold,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
  gold?: boolean;
}) {
  const content = (
    <div
      className={`p-4 rounded-xl border ${
        gold
          ? "bg-gold-bg border-gold/20"
          : highlight
            ? "bg-warning-bg border-warning/20"
            : "bg-surface border-border"
      }`}
    >
      <div className={`mb-2 ${gold ? "text-gold" : highlight ? "text-warning" : "text-text-muted"}`}>
        {icon}
      </div>
      <p className={`text-2xl font-semibold ${gold ? "text-gold" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-sm text-text-secondary mt-0.5">{label}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
