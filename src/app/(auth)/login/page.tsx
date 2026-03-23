"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tab = "individual" | "business";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [tab, setTab] = useState<Tab>("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Liên kết đăng nhập đã được gửi! Vui lòng kiểm tra email.",
      });
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      router.push(redirect);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface rounded-2xl shadow-lg border border-border p-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-gold mb-2">
            Hoa Lang Thang
          </h1>
          <p className="text-text-secondary text-sm">
            Gửi yêu thương, không lo quên
          </p>
        </div>

        {/* Tab */}
        <div className="flex bg-background rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab("individual"); setMessage(null); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === "individual"
                ? "bg-surface text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            Cá nhân
          </button>
          <button
            type="button"
            onClick={() => { setTab("business"); setMessage(null); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === "business"
                ? "bg-surface text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            Doanh nghiệp
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === "success" ? "bg-success-bg text-success" : "bg-error-bg text-error"
          }`}>
            {message.text}
          </div>
        )}

        {tab === "individual" ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email-magic" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input id="email-magic" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50">
              {loading ? "Đang gửi..." : "Gửi liên kết đăng nhập"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email-biz" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input id="email-biz" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@congty.com"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Mật khẩu</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-gold hover:text-gold-dark font-medium">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl border border-border p-8 animate-pulse">
          <div className="h-8 bg-border rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-border rounded w-32 mx-auto" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
