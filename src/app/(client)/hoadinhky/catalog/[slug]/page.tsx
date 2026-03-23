import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, Gift, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { OCCASION_CONFIG, type GiftComboTier, type GiftOccasionType } from "@/types";

export default async function ComboDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createServerSupabase();

  const { data: combo } = await supabase
    .from("gift_combo_tiers")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!combo) notFound();

  const tier = combo as GiftComboTier;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/hoadinhky/catalog"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-gold transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại bộ sưu tập
      </Link>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Hero image */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gold-bg border border-border">
          {tier.image_url ? (
            <Image
              src={tier.image_url}
              alt={tier.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift size={80} className="text-gold/30" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Occasion badges */}
          {tier.occasion_types && tier.occasion_types.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tier.occasion_types.map((type) => {
                const config = OCCASION_CONFIG[type as GiftOccasionType];
                if (!config) return null;
                return (
                  <Badge
                    key={type}
                    size="lg"
                    color={config.color}
                    bgColor={config.color + "18"}
                  >
                    {config.icon} {config.label}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Name */}
          <h1 className="text-2xl lg:text-3xl font-display text-foreground">
            {tier.name}
          </h1>

          {/* Price */}
          <p className="text-3xl lg:text-4xl font-bold text-gold mt-3">
            {formatPrice(tier.price)}
          </p>

          {/* Description */}
          {tier.description && (
            <p className="text-text-secondary mt-4 leading-relaxed">
              {tier.description}
            </p>
          )}

          {/* Includes */}
          {tier.includes && tier.includes.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Bao gồm
              </h2>
              <ul className="space-y-2.5">
                {tier.includes.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-text-secondary"
                  >
                    <div className="w-5 h-5 rounded-full bg-success-bg flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} className="text-success" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery areas */}
          {tier.delivery_areas && tier.delivery_areas.length > 0 && (
            <div className="flex items-start gap-2.5 mt-5 p-3 bg-info-bg rounded-lg">
              <MapPin size={16} className="text-info shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-info">Khu vực giao hàng:</span>{" "}
                <span className="text-info/80">
                  {tier.delivery_areas.join(", ")}
                </span>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-6" />

          {/* CTA */}
          <Link
            href={`/hoadinhky/orders/new?combo=${tier.slug}`}
            className="mt-6 flex items-center justify-center gap-2 w-full h-12 bg-gold text-white rounded-lg font-semibold text-base hover:bg-gold-dark active:bg-gold-dark/90 transition-colors"
          >
            Đặt quà ngay
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Gallery — additional images */}
      {tier.images && tier.images.length > 0 && (
        <div>
          <h2 className="text-lg font-display text-foreground mb-4">
            Hình ảnh chi tiết
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tier.images.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden bg-gold-bg border border-border"
              >
                <Image
                  src={url}
                  alt={`${tier.name} - ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
