import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { GiftRecipientWithOccasions } from "@/types/index";
import { RecipientsList } from "./recipients-list";

export default async function RecipientsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: recipients } = await supabase
    .from("gift_recipients")
    .select("*, gift_occasions(*)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <RecipientsList
      initialRecipients={(recipients as GiftRecipientWithOccasions[]) || []}
    />
  );
}
