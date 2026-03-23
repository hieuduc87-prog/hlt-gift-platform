"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Gift, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/formatters";
import { OCCASION_CONFIG, type GiftComboTier, type GiftOccasionType } from "@/types";

interface CatalogGridProps {
  combos: GiftComboTier[];
}

export function CatalogGrid({ combos }: CatalogGridProps) {
  const [activeOccasion, setActiveOccasion] = useState<string>("all");

  // Collect unique occasion types from all combos
  const occasionTabs = useMemo(() => {
    const types = new Set<string>();
    combos.forEach((combo) => {
      combo.occasion_types?.forEach((t) => types.add(t));
    });
    return Array.from(types);
  }, [combos]);

  // Filter combos by selected occasion
  const filteredCombos = useMemo(() => {
    if (activeOccasion === "all") return combos;
    return combos.filter((c) =>
      c.occasion_types?.includes(activeOccasion)
    );
  }, [combos, activeOccasion]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-foreground">
          Bộ sưu tập quà tặng
        </h1>
        <p className="mt-1 text-text-secondary">
          Chọn combo phù hợp cho mọi dịp đặc biệt
        </p>
      </div>

      {/* Occasion filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveOccasion("all")}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            activeOccasion === "all"
              ? "bg-gold text-white"
              : "bg-surface border border-border text-text-secondary hover:border-gold/30 hover:text-foreground"
          )}
        >
          Tất cả
        </button>
        {occasionTabs.map((type) => {
          const config = OCCASION_CONFIG[type as GiftOccasionType];
          if (!config) return null;
          return (
            <button
              key={type}
              onClick={() => setActiveOccasion(type)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeOccasion === type
                  ? "bg-gold text-white"
                  : "bg-surface border border-border text-text-secondary hover:border-gold/30 hover:text-foreground"
              )}
            >
              {config.icon} {config.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filteredCombos.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Gift size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary font-medium">
            Chưa có combo nào cho dịp này
          </p>
          <p className="text-sm text-text-muted mt-1">
            Hãy chọn danh mục khác hoặc xem tất cả
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCombos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      )}
    </div>
  );
}

function ComboCard({ combo }: { combo: GiftComboTier }) {
  return (
    <Card variant="hover" padding="sm" className="flex flex-col overflow-hidden">
      {/* Image */}
      <Link href={`/catalog/${combo.slug}`} className="block">
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gold-bg">
          {combo.image_url ? (
            <Image
              src={combo.image_url}
              alt={combo.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift size={48} className="text-gold/40" />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 pt-3">
        {/* Occasion badges */}
        {combo.occasion_types && combo.occasion_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {combo.occasion_types.slice(0, 3).map((type) => {
              const config = OCCASION_CONFIG[type as GiftOccasionType];
              if (!config) return null;
              return (
                <Badge
                  key={type}
                  size="sm"
                  color={config.color}
                  bgColor={config.color + "18"}
                >
                  {config.icon} {config.label}
                </Badge>
              );
            })}
            {combo.occasion_types.length > 3 && (
              <Badge size="sm" variant="neutral">
                +{combo.occasion_types.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Name & Price */}
        <Link href={`/catalog/${combo.slug}`} className="group">
          <h3 className="font-display text-lg text-foreground group-hover:text-gold transition-colors">
            {combo.name}
          </h3>
        </Link>
        <p className="text-xl font-semibold text-gold mt-1">
          {formatPrice(combo.price)}
        </p>

        {/* Description */}
        {combo.description && (
          <p className="text-sm text-text-secondary mt-2 line-clamp-2">
            {combo.description}
          </p>
        )}

        {/* Includes */}
        {combo.includes && combo.includes.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {combo.includes.slice(0, 4).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
            {combo.includes.length > 4 && (
              <li className="text-sm text-text-muted pl-[22px]">
                +{combo.includes.length - 4} sản phẩm khác
              </li>
            )}
          </ul>
        )}

        {/* Delivery areas */}
        {combo.delivery_areas && combo.delivery_areas.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-text-muted">
            <MapPin size={12} className="shrink-0" />
            <span>Giao tại: {combo.delivery_areas.join(", ")}</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-3" />

        {/* CTA */}
        <Link
          href={`/orders/new?combo=${combo.slug}`}
          className="mt-3 flex items-center justify-center gap-2 w-full h-10 bg-gold text-white rounded-lg font-medium text-sm hover:bg-gold-dark active:bg-gold-dark/90 transition-colors"
        >
          Đặt quà ngay
          <ArrowRight size={16} />
        </Link>
      </div>
    </Card>
  );
}
