import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/client/Sidebar";
import { Topbar } from "@/components/client/Topbar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch profile + wallet
  const [profileRes, walletRes] = await Promise.all([
    supabase
      .from("gift_profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("gift_wallets")
      .select("balance")
      .eq("profile_id", user.id)
      .single(),
  ]);

  // Admin users → redirect to admin panel
  if (profileRes.data?.role === "admin") redirect("/admin/b2bgifting");

  const userName = profileRes.data?.full_name || user.email || "User";
  const walletBalance = Number(walletRes.data?.balance || 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userName={userName} walletBalance={walletBalance} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
