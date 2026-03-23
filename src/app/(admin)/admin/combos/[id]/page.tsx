"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { GiftComboTier } from "@/types";
import ComboForm from "../combo-form";
import { Loader2 } from "lucide-react";

export default function AdminComboEditPage() {
  const { id } = useParams<{ id: string }>();
  const [combo, setCombo] = useState<GiftComboTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCombo() {
      const res = await fetch("/api/admin/combos");
      if (!res.ok) {
        setError("Không tải được danh sách combo");
        setLoading(false);
        return;
      }
      const combos: GiftComboTier[] = await res.json();
      const found = combos.find((c) => c.id === id);
      if (!found) {
        setError("Không tìm thấy combo");
        setLoading(false);
        return;
      }
      setCombo(found);
      setLoading(false);
    }
    loadCombo();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error || "Không tìm thấy combo"}</p>
      </div>
    );
  }

  return <ComboForm combo={combo} />;
}
