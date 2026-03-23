"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { RELATIONSHIP_CONFIG } from "@/types/index";
import type { RelationshipTag } from "@/types/index";

export default function NewRecipientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    relationship: "other" as RelationshipTag,
    address: "",
    district: "",
    city: "Ha Noi",
    note: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          district: form.district || undefined,
          note: form.note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Co loi xay ra");
        return;
      }

      router.push("/recipients");
    } catch {
      setError("Khong the ket noi den may chu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/recipients"
          className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Them nguoi nhan
          </h1>
          <p className="text-sm text-text-secondary">
            Nhap thong tin nguoi nhan qua
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card padding="lg" className="space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-error-bg text-error text-sm">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ho ten *"
              placeholder="Nguyen Van A"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              required
            />
            <Input
              label="So dien thoai"
              placeholder="0912 345 678"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Quan he
              </label>
              <select
                value={form.relationship}
                onChange={(e) =>
                  updateField("relationship", e.target.value)
                }
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
              >
                {Object.entries(RELATIONSHIP_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.icon} {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Dia chi giao hang
            </h3>
            <div className="space-y-4">
              <Input
                label="Dia chi"
                placeholder="So nha, ten duong..."
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Quan/Huyen"
                  placeholder="Hoan Kiem"
                  value={form.district}
                  onChange={(e) => updateField("district", e.target.value)}
                />
                <Input
                  label="Thanh pho"
                  placeholder="Ha Noi"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="border-t border-border pt-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Ghi chu
              </label>
              <textarea
                placeholder="Ghi chu them ve nguoi nhan..."
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Link href="/recipients">
              <Button variant="ghost" type="button">
                Huy
              </Button>
            </Link>
            <Button type="submit" disabled={saving || !form.full_name.trim()}>
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Dang luu..." : "Luu"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
