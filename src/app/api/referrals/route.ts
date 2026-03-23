import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HLT";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's referral code (the one where they are the referrer)
  const { data: myReferral } = await supabase
    .from("gift_referrals")
    .select("referral_code")
    .eq("referrer_id", user.id)
    .is("referred_id", null)
    .limit(1)
    .single();

  // Get all referrals where this user is the referrer
  const { data: referrals } = await supabase
    .from("gift_referrals")
    .select(`
      id,
      referral_code,
      referred_id,
      status,
      bonus_amount,
      reward_amount,
      referrer_rewarded,
      referred_rewarded,
      created_at
    `)
    .eq("referrer_id", user.id)
    .not("referred_id", "is", null)
    .order("created_at", { ascending: false });

  // Fetch referred profiles for display
  const referredIds = (referrals || [])
    .map((r) => r.referred_id)
    .filter(Boolean) as string[];

  let referredProfiles: Record<string, { full_name: string; email: string | null }> = {};
  if (referredIds.length > 0) {
    const { data: profiles } = await supabase
      .from("gift_profiles")
      .select("id, full_name, email")
      .in("id", referredIds);

    if (profiles) {
      referredProfiles = Object.fromEntries(
        profiles.map((p) => [p.id, { full_name: p.full_name, email: p.email }])
      );
    }
  }

  const referralList = (referrals || []).map((r) => ({
    id: r.id,
    referred_name: referredProfiles[r.referred_id]?.full_name || "Người dùng",
    referred_email: referredProfiles[r.referred_id]?.email || null,
    status: r.status,
    reward_amount: r.reward_amount || r.bonus_amount || 50000,
    referrer_rewarded: r.referrer_rewarded,
    created_at: r.created_at,
  }));

  return NextResponse.json({
    referral_code: myReferral?.referral_code || null,
    referrals: referralList,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has a referral code
  const { data: existing } = await supabase
    .from("gift_referrals")
    .select("referral_code")
    .eq("referrer_id", user.id)
    .is("referred_id", null)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ referral_code: existing.referral_code });
  }

  // Generate unique code
  let code = generateReferralCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: clash } = await supabase
      .from("gift_referrals")
      .select("id")
      .eq("referral_code", code)
      .single();

    if (!clash) break;
    code = generateReferralCode();
    attempts++;
  }

  // Insert referral row (referred_id null = this is the "master" code row)
  const { data: created, error } = await supabase
    .from("gift_referrals")
    .insert({
      referrer_id: user.id,
      referral_code: code,
      status: "active",
      reward_amount: 50000,
    })
    .select("referral_code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ referral_code: created.referral_code });
}
