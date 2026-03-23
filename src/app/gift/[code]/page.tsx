import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import UnwrapClient from "./unwrap-client";

interface GiftPageData {
  token: string;
  recipient_viewed_at: string | null;
  recipient_response: string | null;
  order: {
    recipient_name: string;
    card_message: string | null;
    status: string;
    combo_name: string | null;
    sender_name: string | null;
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  return {
    title: "B\u1ea1n c\u00f3 m\u1ed9t m\u00f3n qu\u00e0 \u2014 Hoa Lang Thang",
    description: "Ai \u0111\u00f3 \u0111\u00e3 g\u1eedi t\u1eb7ng b\u1ea1n m\u1ed9t m\u00f3n qu\u00e0 \u0111\u1eb7c bi\u1ec7t!",
  };
}

export default async function GiftPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const service = createServiceClient();

  const { data: tokenRow, error } = await service
    .from("gift_unwrap_tokens")
    .select(
      `
      id,
      token,
      recipient_viewed_at,
      recipient_response,
      expires_at,
      gift_orders!inner (
        recipient_name,
        card_message,
        status,
        profile_id,
        gift_combo_tiers ( name ),
        gift_profiles!gift_orders_profile_id_fkey ( full_name )
      )
    `
    )
    .eq("token", code)
    .single();

  if (error || !tokenRow) {
    notFound();
  }

  // Check expiry
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = tokenRow.gift_orders as any;

  const giftData: GiftPageData = {
    token: tokenRow.token,
    recipient_viewed_at: tokenRow.recipient_viewed_at,
    recipient_response: tokenRow.recipient_response,
    order: {
      recipient_name: order.recipient_name,
      card_message: order.card_message,
      status: order.status,
      combo_name: order.gift_combo_tiers?.name ?? null,
      sender_name: order.gift_profiles?.full_name ?? null,
    },
  };

  return <UnwrapClient data={giftData} />;
}
