"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "individual" | "business";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("individual");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (role === "business" && password !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      setLoading(false);
      return;
    }

    if (role === "business" && password.length < 6) {
      setMessage({
        type: "error",
        text: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
      setLoading(false);
      return;
    }

    try {
      if (role === "individual") {
        // Individual: use magic link (signInWithOtp) with metadata
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
            data: {
              full_name: fullName,
              phone,
              role: "individual",
              gift_platform: "true",
            },
          },
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({
            type: "success",
            text: "Kiểm tra email để xác nhận tài khoản và đăng nhập.",
          });
        }
      } else {
        // Business: sign up with password
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
            data: {
              full_name: fullName,
              phone,
              role: "business",
              company_name: companyName,
              tax_code: taxCode,
              gift_platform: "true",
            },
          },
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({
            type: "success",
            text: "Kiểm tra email để xác nhận tài khoản.",
          });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Đã xảy ra lỗi. Vui lòng thử lại." });
    }

    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface rounded-2xl shadow-lg border border-border p-8">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-gold mb-2">
            Hoa Lang Thang
          </h1>
          <p className="text-text-secondary text-sm">Tạo tài khoản mới</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-background rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setRole("individual");
              setMessage(null);
            }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              role === "individual"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Cá nhân
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("business");
              setMessage(null);
            }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              role === "business"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Doanh nghiệp
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-success-bg text-success"
                : "bg-error-bg text-error"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common: Full Name */}
          <div>
            <label
              htmlFor="full-name"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Họ tên
            </label>
            <input
              id="full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyen Van A"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
            />
          </div>

          {/* Common: Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
            />
          </div>

          {/* Common: Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Số điện thoại
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901 234 567"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
            />
          </div>

          {/* Business: Company Name */}
          {role === "business" && (
            <div>
              <label
                htmlFor="company-name"
                className="block text-sm font-medium text-text-primary mb-1.5"
              >
                Tên công ty
              </label>
              <input
                id="company-name"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Cong ty TNHH ABC"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
            </div>
          )}

          {/* Business: Tax Code */}
          {role === "business" && (
            <div>
              <label
                htmlFor="tax-code"
                className="block text-sm font-medium text-text-primary mb-1.5"
              >
                Mã số thuế
              </label>
              <input
                id="tax-code"
                type="text"
                required
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="0123456789"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
            </div>
          )}

          {/* Business: Password */}
          {role === "business" && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="It nhat 6 ky tu"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhap lai mat khau"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Đang xử lý..."
              : role === "individual"
                ? "Gửi liên kết đăng ký"
                : "Đăng ký"}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="text-gold hover:text-gold-dark font-medium transition-colors"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
