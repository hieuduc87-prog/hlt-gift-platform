import { createServerSupabase } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { GiftRecipientWithOccasions } from "@/types/index";
import { RecipientDetail } from "./recipient-detail";

export default async function RecipientDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: recipient, error } = await supabase
    .from("gift_recipients")
    .select("*, gift_occasions(*)")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !recipient) notFound();

  return (
    <RecipientDetail
      recipient={recipient as GiftRecipientWithOccasions}
    />
  );
}
