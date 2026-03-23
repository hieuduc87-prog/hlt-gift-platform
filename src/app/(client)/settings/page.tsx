"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Building2,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { GiftProfile } from "@/types";

export default function SettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<GiftProfile | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTaxCode, setCompanyTaxCode] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setEmail(user.email || "");

    const { data } = await supabase
      .from("gift_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      const p = data as GiftProfile;
      setProfile(p);
      setFullName(p.full_name || "");
      setPhone(p.phone || "");
      setAvatarUrl(p.avatar_url || "");
      setCompanyName(p.company_name || "");
      setCompanyTaxCode(p.company_tax_code || "");
      setCompanyAddress(p.company_address || "");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);

    const updates: Record<string, string | null> = {
      full_name: fullName.trim() || profile.full_name,
      phone: phone.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (profile.role === "business") {
      updates.company_name = companyName.trim() || null;
      updates.company_tax_code = companyTaxCode.trim() || null;
      updates.company_address = companyAddress.trim() || null;
    }

    const { error } = await supabase
      .from("gift_profiles")
      .update(updates)
      .eq("id", profile.id);

    if (error) {
      showToast("error", "Lưu thất bại: " + error.message);
    } else {
      showToast("success", "Đã lưu thay đổi");
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      showToast("error", "Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPassword.length < 6) {
      showToast("error", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "Xác nhận mật khẩu không khớp");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      showToast("error", "Đổi mật khẩu thất bại: " + error.message);
    } else {
      showToast("success", "Đã đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-10 bg-border rounded-xl w-48" />
        <div className="h-6 bg-border rounded-xl w-72" />
        <div className="h-80 bg-border rounded-xl" />
        <div className="h-48 bg-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-success-bg text-success border border-success/20"
              : "bg-error-bg text-error border border-error/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-foreground">Cài đặt</h1>
        <p className="mt-1 text-text-secondary">
          Thông tin tài khoản và cấu hình
        </p>
      </div>

      {/* Profile section */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={20} className="text-gold" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Thông tin cá nhân
          </h2>
        </div>

        <div className="space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Họ tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-muted cursor-not-allowed"
            />
            <p className="text-xs text-text-muted mt-1">
              Email không thể thay đổi
            </p>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ảnh đại diện
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Business section */}
      {profile?.role === "business" && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={20} className="text-gold" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              Thông tin doanh nghiệp
            </h2>
          </div>

          <div className="space-y-4">
            {/* Company name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tên công ty
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Công ty TNHH..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>

            {/* Tax code */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mã số thuế
              </label>
              <input
                type="text"
                value={companyTaxCode}
                onChange={(e) => setCompanyTaxCode(e.target.value)}
                placeholder="0123456789"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>

            {/* Company address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Địa chỉ công ty
              </label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save profile button */}
      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang lưu...
          </>
        ) : (
          <>
            <Save size={18} />
            Lưu thay đổi
          </>
        )}
      </button>

      {/* Password section */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={20} className="text-gold" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Đổi mật khẩu
          </h2>
        </div>

        <div className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-error mt-1">
                Mật khẩu không khớp
              </p>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={
              changingPassword || !newPassword || !confirmPassword
            }
            className="w-full py-3 border border-border rounded-xl text-foreground font-medium hover:bg-background transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {changingPassword ? (
              <>
                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                Đang đổi...
              </>
            ) : (
              <>
                <Lock size={16} />
                Đổi mật khẩu
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
