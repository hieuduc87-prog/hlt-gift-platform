import Link from "next/link";
import { Users, CalendarDays, Gift, Check } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import type { GiftComboTier } from "@/types";

async function getComboTiers(): Promise<GiftComboTier[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("gift_combo_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch combo tiers:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function LandingPage() {
  const comboTiers = await getComboTiers();

  return (
    <main className="min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Subtle radial gradient background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,169,110,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Decorative dots pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C9A96E 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl md:leading-tight">
            Gửi yêu thương,
            <br />
            <span className="text-gold">không lo quên</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary md:text-xl">
            Hoa Lang Thang tự động nhắc nhở và gửi quà cho người bạn yêu
            thương &mdash; sinh nhật, kỷ niệm, hay bất kỳ dịp đặc biệt nào.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              Bắt đầu ngay
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-gold px-8 text-base font-medium text-gold transition-colors hover:bg-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="bg-surface py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-display text-3xl font-semibold text-foreground md:text-4xl">
            Cách hoạt động
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-text-secondary">
            Chỉ 3 bước đơn giản để không bao giờ quên tặng quà người thương.
          </p>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {(
              [
                {
                  number: "01",
                  icon: Users,
                  title: "Thêm người thân",
                  description:
                    "Thêm danh sách người bạn muốn tặng quà — sinh nhật, sở thích, địa chỉ.",
                },
                {
                  number: "02",
                  icon: CalendarDays,
                  title: "Chọn dịp & combo",
                  description:
                    "Chọn dịp tặng quà và combo phù hợp. Hệ thống tự nhắc trước 7 ngày.",
                },
                {
                  number: "03",
                  icon: Gift,
                  title: "Tự động giao",
                  description:
                    "Chúng tôi chuẩn bị và giao quà đúng ngày, kèm thiệp cá nhân hóa.",
                },
              ] as const
            ).map((step) => (
              <Card
                key={step.number}
                variant="hover"
                padding="lg"
                className="relative text-center"
              >
                {/* Step number */}
                <span className="font-display text-5xl font-bold text-gold/15">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-gold-bg">
                  <step.icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Combo Tiers ─── */}
      {comboTiers.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-display text-3xl font-semibold text-foreground md:text-4xl">
              Chọn combo quà tặng
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-text-secondary">
              Mỗi combo được Hoa Lang Thang tuyển chọn kỹ lưỡng, sẵn sàng giao đến
              tận tay người nhận.
            </p>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {comboTiers.map((tier) => (
                <Card
                  key={tier.id}
                  variant="hover"
                  padding="lg"
                  className="flex flex-col"
                >
                  {/* Name */}
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <p className="mt-2 font-display text-3xl font-bold text-gold">
                    {formatPrice(tier.price)}
                  </p>

                  {/* Description */}
                  {tier.description && (
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {tier.description}
                    </p>
                  )}

                  {/* Includes list */}
                  {Array.isArray(tier.includes) && tier.includes.length > 0 && (
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {tier.includes.map((item: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-foreground"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                            strokeWidth={2}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Select button */}
                  <Link
                    href="/register"
                    className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg border border-gold text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                  >
                    Chọn combo này
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Footer ─── */}
      <section className="bg-gold-bg py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
            Bắt đầu tặng quà thông minh
          </h2>
          <p className="mt-4 text-text-secondary">
            Đăng ký miễn phí, thêm người thân, và để Hoa Lang Thang lo phần còn lại.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-gold px-10 text-base font-medium text-white shadow-sm transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            Đăng ký ngay
          </Link>
        </div>
      </section>
    </main>
  );
}
