"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OCCASION_CONFIG } from "@/types";
import type { GiftComboTier, GiftOccasionType } from "@/types";
import { ArrowLeft, Plus, X, Save, Loader2 } from "lucide-react";
import Link from "next/link";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ComboFormProps {
  combo?: GiftComboTier;
}

export default function ComboForm({ combo }: ComboFormProps) {
  const router = useRouter();
  const isEdit = !!combo;

  const [name, setName] = useState(combo?.name || "");
  const [slug, setSlug] = useState(combo?.slug || "");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState(combo?.description || "");
  const [price, setPrice] = useState(combo?.price?.toString() || "");
  const [includes, setIncludes] = useState<string[]>(combo?.includes || []);
  const [newInclude, setNewInclude] = useState("");
  const [occasionTypes, setOccasionTypes] = useState<string[]>(
    combo?.occasion_types || []
  );
  const [sortOrder, setSortOrder] = useState(combo?.sort_order?.toString() || "0");
  const [isActive, setIsActive] = useState(combo?.is_active ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  function addInclude() {
    const trimmed = newInclude.trim();
    if (trimmed && !includes.includes(trimmed)) {
      setIncludes([...includes, trimmed]);
      setNewInclude("");
    }
  }

  function removeInclude(idx: number) {
    setIncludes(includes.filter((_, i) => i !== idx));
  }

  function toggleOccasion(type: string) {
    setOccasionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vui lòng nhập tên combo");
      return;
    }
    if (!slug.trim()) {
      setError("Vui lòng nhập slug");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Vui lòng nhập giá hợp lệ");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      price: Number(price),
      includes,
      occasion_types: occasionTypes,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
    };

    const url = isEdit
      ? `/api/admin/combos/${combo.id}`
      : "/api/admin/combos";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Có lỗi xảy ra");
      setLoading(false);
      return;
    }

    router.push("/admin/combos");
    router.refresh();
  }

  const inputClass =
    "w-full bg-[#1A1A1A] border border-admin-border text-admin-text rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold placeholder:text-admin-text-secondary/50";

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/combos"
        className="inline-flex items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-text mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Combo quà tặng
      </Link>

      <h1 className="text-2xl font-display text-gold mb-6">
        {isEdit ? "Sửa combo" : "Thêm combo mới"}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-admin-text mb-1.5">
            Tên combo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="VD: Combo Yêu Thương"
            className={inputClass}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-admin-text mb-1.5">
            Slug <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManual(true);
            }}
            placeholder="combo-yeu-thuong"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-admin-text-secondary">
            Tự động tạo từ tên. Bấm sửa để thay đổi thủ công.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-admin-text mb-1.5">
            Mô tả
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Mô tả ngắn về combo..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-admin-text mb-1.5">
            Giá (VND) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="500000"
            min={0}
            className={inputClass}
          />
        </div>

        {/* Includes */}
        <div>
          <label className="block text-sm font-medium text-admin-text mb-1.5">
            Bao gồm
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInclude}
              onChange={(e) => setNewInclude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInclude();
                }
              }}
              placeholder="VD: Hoa hồng Ecuador"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={addInclude}
              className="px-3 py-2.5 bg-gold/20 text-gold hover:bg-gold/30 rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {includes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {includes.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-admin-border rounded-lg text-sm text-admin-text"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeInclude(idx)}
                    className="text-admin-text-secondary hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Occasion Types */}
        <div>
          <label className="block text-sm font-medium text-admin-text mb-2">
            Loại dịp
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(OCCASION_CONFIG) as GiftOccasionType[]).map(
              (type) => {
                const cfg = OCCASION_CONFIG[type];
                const selected = occasionTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleOccasion(type)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selected
                        ? "border-gold bg-gold/20 text-gold"
                        : "border-admin-border bg-[#1A1A1A] text-admin-text-secondary hover:border-gold/30"
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    {cfg.label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-admin-text mb-1.5">
            Thứ tự sắp xếp
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
            className={`w-32 ${inputClass}`}
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? "bg-green-600" : "bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-admin-text">
            {isActive ? "Đang hiển thị" : "Đã ẩn"}
          </span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-admin-border">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isEdit ? "Cập nhật" : "Tạo combo"}
          </button>
        </div>
      </form>
    </div>
  );
}
