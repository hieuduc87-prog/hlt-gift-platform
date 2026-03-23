import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("gift_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-admin-bg text-admin-text">
      {/* Admin sidebar */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-admin-surface border-r border-admin-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-admin-border">
          <Link href="/admin" className="font-display text-lg text-gold">
            HLT Admin
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/orders", label: "Đơn hàng" },
            { href: "/admin/combos", label: "Sản phẩm" },
            { href: "/admin/clients", label: "Khách hàng" },
            { href: "/admin/delivery", label: "Giao hàng" },
            { href: "/admin/cards", label: "Thiệp mẫu" },
            { href: "/admin/finance", label: "Tài chính" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 rounded-lg text-sm text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="ml-60">
        <header className="h-16 bg-admin-surface border-b border-admin-border flex items-center px-6">
          <h2 className="text-sm text-admin-text-secondary">Gift Platform Admin</h2>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
