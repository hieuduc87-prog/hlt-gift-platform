"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/formatters";
import { FileText, Sparkles, Copy, Check, Plus, X } from "lucide-react";
import type { GiftCard, GiftOccasionType } from "@/types";
import { OCCASION_CONFIG, RELATIONSHIP_CONFIG } from "@/types";
import type { RelationshipTag } from "@/types";

interface CardWithOrder extends GiftCard {
  gift_orders?: {
    code: string;
    recipient_name: string;
  } | null;
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // AI generate form state
  const [occasion, setOccasion] = useState<GiftOccasionType>("birthday");
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState<RelationshipTag>("friend");
  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch {
      // silently handle
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleGenerate() {
    if (!recipientName.trim()) return;
    setGenerating(true);
    setGeneratedText("");
    try {
      const res = await fetch("/api/cards/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion,
          recipient_name: recipientName,
          relationship,
          sender_name: senderName,
          note,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedText(data.text || data.message || "");
      }
    } catch {
      // silently handle
    }
    setGenerating(false);
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetModal() {
    setOccasion("birthday");
    setRecipientName("");
    setRelationship("friend");
    setSenderName("");
    setNote("");
    setGeneratedText("");
    setGenerating(false);
    setCopied(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-border rounded-xl w-48" />
        <div className="h-6 bg-border rounded-xl w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-border rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Thiệp chúc</h1>
          <p className="mt-1 text-text-secondary">
            Xem và tạo lời chúc cho thiệp tặng quà
          </p>
        </div>
        <button
          onClick={() => {
            resetModal();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors"
        >
          <Sparkles size={18} />
          <span>Tạo thiệp AI</span>
        </button>
      </div>

      {/* Card list */}
      {cards.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <FileText size={40} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary font-medium">
            Chưa có thiệp nào
          </p>
          <p className="text-sm text-text-muted mt-1">
            Thiệp sẽ được tạo khi bạn đặt quà hoặc dùng AI tạo lời chúc
          </p>
          <button
            onClick={() => {
              resetModal();
              setShowModal(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gold-bg text-gold font-medium rounded-xl hover:bg-gold/10 transition-colors"
          >
            <Plus size={16} />
            Tạo thiệp AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-surface border border-border rounded-xl p-5 hover:border-gold/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gold-bg flex items-center justify-center">
                    <FileText size={16} className="text-gold" />
                  </div>
                  {card.gift_orders?.code && (
                    <span className="text-xs font-mono text-text-muted bg-background px-2 py-0.5 rounded">
                      {card.gift_orders.code}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted">
                  {formatDate(card.created_at)}
                </span>
              </div>

              {card.gift_orders?.recipient_name && (
                <p className="text-sm font-medium text-foreground mb-1.5">
                  Gửi: {card.gift_orders.recipient_name}
                </p>
              )}

              {card.message ? (
                <p className="text-sm text-text-secondary line-clamp-3 italic">
                  &ldquo;{card.message}&rdquo;
                </p>
              ) : (
                <p className="text-sm text-text-muted italic">
                  Chưa có lời chúc
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Generate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-gold" />
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Tạo lời chúc AI
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-text-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Occasion */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Dịp tặng quà
                </label>
                <select
                  value={occasion}
                  onChange={(e) =>
                    setOccasion(e.target.value as GiftOccasionType)
                  }
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                >
                  {(
                    Object.entries(OCCASION_CONFIG) as [
                      GiftOccasionType,
                      { label: string; icon: string },
                    ][]
                  ).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.icon} {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Tên người nhận
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ví dụ: Chị Hương"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Mối quan hệ
                </label>
                <select
                  value={relationship}
                  onChange={(e) =>
                    setRelationship(e.target.value as RelationshipTag)
                  }
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                >
                  {(
                    Object.entries(RELATIONSHIP_CONFIG) as [
                      RelationshipTag,
                      { label: string; icon: string },
                    ][]
                  ).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.icon} {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sender name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Tên người gửi
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Tên bạn hoặc để trống"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Ghi chú thêm
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Chị ấy thích hoa hồng, vừa thăng chức..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!recipientName.trim() || generating}
                className="w-full py-3 bg-gold hover:bg-gold-dark text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Tạo lời chúc
                  </>
                )}
              </button>

              {/* Generated text preview */}
              {generatedText && (
                <div className="space-y-3">
                  <div className="bg-gold-bg rounded-xl p-5">
                    <p className="text-foreground italic leading-relaxed whitespace-pre-wrap">
                      {generatedText}
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(generatedText)}
                    className="w-full py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-background transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-gold" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Sao chép lời chúc
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
