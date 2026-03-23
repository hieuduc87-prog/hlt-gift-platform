import { createServerSupabase } from "@/lib/supabase/server";
import type { GiftComboTier } from "@/types";
import { CatalogGrid } from "./catalog-grid";

export default async function CatalogPage() {
  const supabase = await createServerSupabase();

  const { data: combos } = await supabase
    .from("gift_combo_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return <CatalogGrid combos={(combos as GiftComboTier[]) || []} />;
}
