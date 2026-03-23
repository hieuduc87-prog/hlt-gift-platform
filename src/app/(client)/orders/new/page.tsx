"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/formatters";
import { OCCASION_CONFIG, RELATIONSHIP_CONFIG } from "@/types";
import type { GiftRecipient, GiftComboTier } from "@/types";
import { ArrowLeft, ArrowRight, Check, Gift } from "lucide-react";
import Link from "next/link";

type Step = "recipient" | "combo" | "details" | "confirm";

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("recipient");
  const [recipients, setRecipients] = useState<GiftRecipient[]>([]);
  const [combos, setCombos] = useState<GiftComboTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Selections
  const [selectedRecipient, setSelectedRecipient] = useState<GiftRecipient | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<GiftComboTier | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("09:00-12:00");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [cardMessage, setCardMessage] = useState("");

  useEffect(() => {
    async function load() {
      const [recRes, comboRes] = await Promise.all([
        supabase.from("gift_recipients").select("*").order("full_name"),
        fetch("/api/combos").then((r) => r.json()),
      ]);
      setRecipients(recRes.data || []);
      setCombos(comboRes || []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedRecipient) {
      setDeliveryAddress(selectedRecipient.address || "");
    }
  }, [selectedRecipient]);

  async function handleSubmit() {
    if (!selectedRecipient || !selectedCombo) return;
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = `GIFT-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const { error: err } = await supabase.from("gift_orders").insert({
      code,
      profile_id: user.id,
      recipient_id: selectedRecipient.id,
      combo_tier_id: selectedCombo.id,
      recipient_name: selectedRecipient.full_name,
      recipient_phone: selectedRecipient.phone,
      delivery_address: deliveryAddress,
      delivery_date: deliveryDate || null,
      delivery_time: deliveryTime,
      delivery_note: deliveryNote,
      card_message: cardMessage,
      subtotal: selectedCombo.price,
      total: selectedCombo.price,
      status: "draft",
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      router.push("/orders");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 bg-border rounded w-48" />
        <div className="h-64 bg-border rounded-xl" />
      </div>
    );
  }

  const steps: { key: Step; label: string }[] = [
    { key: "recipient", label: "Người nhận" },
    { key: "combo", label: "Combo" },
    { key: "details", label: "Chi tiết" },
    { key: "confirm", label: "Xác nhận" },
  ];

  return (
    <div className="max-w-2xl">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-foreground mb-4">
        <ArrowLeft size={14} /> Đơn hàng
      </Link>

      <h1 className="text-2xl font-display text-foreground mb-6">Đặt quà mới</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === s.key
                  ? "bg-gold text-white"
                  : steps.findIndex((x) => x.key === step) > i
                    ? "bg-success text-white"
                    : "bg-background text-text-muted border border-border"
              }`}
            >
              {steps.findIndex((x) => x.key === step) > i ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${step === s.key ? "text-foreground font-medium" : "text-text-muted"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">{error}</div>
      )}

      {/* Step 1: Select recipient */}
      {step === "recipient" && (
        <div className="space-y-3">
          <p className="text-text-secondary mb-4">Chọn người bạn muốn tặng quà</p>
          {recipients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted mb-3">Chưa có người nhận nào</p>
              <Link href="/recipients/new" className="text-gold hover:text-gold-dark font-medium text-sm">
                Thêm người nhận
              </Link>
            </div>
          ) : (
            recipients.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRecipient(r); setStep("combo"); }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selectedRecipient?.id === r.id
                    ? "border-gold bg-gold-bg"
                    : "border-border bg-surface hover:border-gold/30"
                }`}
              >
                <p className="font-medium text-foreground">{r.full_name}</p>
                <p className="text-sm text-text-secondary">
                  {RELATIONSHIP_CONFIG[r.relationship]?.label} {r.phone ? `· ${r.phone}` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 2: Select combo */}
      {step === "combo" && (
        <div className="space-y-3">
          <p className="text-text-secondary mb-4">Chọn combo quà tặng cho {selectedRecipient?.full_name}</p>
          {combos.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedCombo(c); setStep("details"); }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedCombo?.id === c.id
                  ? "border-gold bg-gold-bg"
                  : "border-border bg-surface hover:border-gold/30"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-sm text-text-secondary mt-1">{c.description}</p>
                </div>
                <p className="font-display font-bold text-gold text-lg">{formatPrice(c.price)}</p>
              </div>
              {Array.isArray(c.includes) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {c.includes.map((item: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded-md text-text-secondary">
                      <Check size={10} className="text-gold" /> {item}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
          <button onClick={() => setStep("recipient")} className="text-sm text-text-secondary hover:text-foreground mt-2">
            <ArrowLeft size={14} className="inline" /> Quay lại
          </button>
        </div>
      )}

      {/* Step 3: Delivery details */}
      {step === "details" && (
        <div className="space-y-4">
          <p className="text-text-secondary mb-4">Chi tiết giao hàng và thiệp</p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Ngày giao</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Khung giờ</label>
            <select
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="09:00-12:00">Sáng (9:00 - 12:00)</option>
              <option value="13:00-17:00">Chiều (13:00 - 17:00)</option>
              <option value="17:00-20:00">Tối (17:00 - 20:00)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Địa chỉ giao</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Số nhà, đường, quận/huyện"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Lời nhắn trên thiệp</label>
            <textarea
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              placeholder="Chúc mừng sinh nhật! Chúc bạn luôn vui vẻ và hạnh phúc..."
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Ghi chú giao hàng</label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Ví dụ: gọi trước 30 phút"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("combo")} className="flex-1 py-3 border border-border rounded-xl text-text-secondary hover:bg-surface-hover">
              Quay lại
            </button>
            <button onClick={() => setStep("confirm")} className="flex-1 py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl">
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Người nhận</span>
              <span className="font-medium">{selectedRecipient?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Combo</span>
              <span className="font-medium">{selectedCombo?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Ngày giao</span>
              <span className="font-medium">{deliveryDate || "Chưa chọn"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Địa chỉ</span>
              <span className="font-medium truncate max-w-[200px]">{deliveryAddress || "Chưa nhập"}</span>
            </div>
            {cardMessage && (
              <div className="pt-2 border-t border-border-subtle">
                <p className="text-xs text-text-muted mb-1">Lời nhắn thiệp:</p>
                <p className="text-sm text-foreground italic">&ldquo;{cardMessage}&rdquo;</p>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border-subtle">
              <span className="font-semibold text-foreground">Tổng tiền</span>
              <span className="font-display font-bold text-gold text-lg">
                {formatPrice(selectedCombo?.price || 0)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("details")} className="flex-1 py-3 border border-border rounded-xl text-text-secondary hover:bg-surface-hover">
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Gift size={16} />
              {submitting ? "Đang đặt..." : "Xác nhận đặt quà"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
